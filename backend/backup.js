const fs = require("fs-extra");
const path = require("path");
const { sendBackupFailedMail } = require("./controllers/mail.controller");
require("dotenv").config();
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const pool = require("./utils/dbConnect");
const { getSqlDate } = require("./utils/helperFunctions");
const { encryptFile } = require("./utils/encryption");
const BACKUP_DIR = path.join(__dirname, "backups");

const cleanErrorReason = (message) => {
    if (!message) return "";
    let clean = message.replace(/System error \d+ has occurred\.?/gi, "");
    clean = clean.replace(/Command failed:[\s\S]*?(?=\r?\n|$)/gi, "");
    clean = clean.replace(/code:\s*\d+/gi, "");
    return clean.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
};

const getTimeStamp = () => {
    const date = new Date();
    const year = (date.getFullYear() % 100).toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}${month}${year}${hours}${minutes}${seconds}`;
};

async function backupDatabaseLocally() {
    await fs.ensureDir(BACKUP_DIR);
    const mysqldumpPath =
        '"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"';

    const timestamp = getTimeStamp();
    const sqlFileName = `backup_${process.env.DB_NAME}_${timestamp}.sql`;
    const sqlOutputPath = path.join(BACKUP_DIR, sqlFileName);

    const cmd = `${mysqldumpPath} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${sqlOutputPath}"`;
    try {
        const { stderr } = await execPromise(cmd);
        if (stderr) {
            // console.warn("MySQL Warning/Notes:", stderr);
        }

        const amsFileName = `backup_${process.env.DB_NAME}_${timestamp}.ams`;
        const amsOutputPath = path.join(BACKUP_DIR, amsFileName);

        // Encrypt the SQL file to .ams
        await encryptFile(sqlOutputPath, amsOutputPath);

        // Delete the original SQL file
        if (fs.existsSync(sqlOutputPath)) {
            fs.unlinkSync(sqlOutputPath);
        }

        const stats = fs.statSync(amsOutputPath);
        const fileSize = parseFloat((stats.size / 1024).toFixed(2));

        return { fileName: amsFileName, fileSize, outputPath: amsOutputPath };
    } catch (error) {
        if (fs.existsSync(sqlOutputPath)) {
            try {
                fs.unlinkSync(sqlOutputPath);
            } catch (err) {}
        }
        const detail = cleanErrorReason(error.stderr ? error.stderr.trim() : (error.message || String(error)));
        throw new Error(`Failed to backup data locally: ${detail}`);
    }
}

async function backupToNetwork(outputPath) {
    const query = `SELECT \`config_key\`, \`value\` FROM config_a1b2c3d4 WHERE \`config_key\`='user' OR \`config_key\`='password' OR \`config_key\`='shared_folder' OR \`config_key\`='backup_ip'`;

    let [result] = await pool.query(query);

    result = result.reduce((acc, item) => {
        acc[item.config_key] = item.value;
        return acc;
    }, {});

    const {
        user,
        password,
        shared_folder: sharedFolder,
        backup_ip: backupIp,
    } = result;

    if (!user || !password || !sharedFolder || !backupIp) {
        throw new Error("Network configuration is incomplete");
    }

    const finalIp = backupIp;
    const finalFolder = sharedFolder;
    const networkPath = `\\\\${finalIp}\\${finalFolder}`;
    const fileName = path.basename(outputPath);
    try {
        try {
            await execPromise(`net use ${networkPath} /delete /y`);
        } catch (err) {}
        try {
            await execPromise(`net use \\\\${finalIp} /delete /y`);
        } catch (err) {}
        try {
            await execPromise(`net use \\\\${finalIp}\\IPC$ /delete /y`);
        } catch (err) {}
        await execPromise(
            `net use ${networkPath} /user:"${user}" "${password}"`
        );
        await execPromise(`copy "${outputPath}" "${networkPath}\\${fileName}"`);
        await execPromise(`net use ${networkPath} /delete /y`);
        try {
            await execPromise(`net use \\\\${finalIp} /delete /y`);
        } catch (err) {}

        // Server upload succeeded, delete local copy
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
    } catch (error) {
        console.log(error);
        const detail = cleanErrorReason(error.stderr ? error.stderr.trim() : (error.message || String(error)));
        throw new Error(`Failed to backup data to network: ${detail}`);
    }
}

async function updateLastBackupDate(fileName, fileSize, location) {
    const tableName = `config_a1b2c3d4`;
    const logTable = `backup_log_a1b2c3d4`;
    try {
        const timestamp = getSqlDate();
        const res = await pool.query(
            `SELECT * FROM ${tableName} WHERE config_key = 'last_backup'`
        );
        if (res.length === 0) {
            await pool.query(
                `INSERT INTO ${tableName} (config_key, \`value\`) VALUES ('last_backup', ?)`,
                [timestamp]
            );
        } else {
            await pool.query(
                `UPDATE ${tableName} SET \`value\` = ? WHERE config_key = 'last_backup'`,
                [timestamp]
            );
        }

        if (fileName && fileSize && location) {
            await pool.query(
                `INSERT INTO ${logTable} (file_name, file_size, location, created_at) VALUES (?, ?, ?, ?)`,
                [fileName, fileSize, location, timestamp]
            );
        }
        return timestamp;
    } catch (error) {
        console.error("Error updating last backup date:", error);
        return false;
    }
}

async function backupDatabase(fromApi = false) {
    let localbackup;
    let location = "local";
    let backupError = null;

    try {
        localbackup = await backupDatabaseLocally();
    } catch (error) {
        let errorReason = error.message || "Failed to backup data locally";
        if (!fromApi) {
            sendBackupFailedMail(errorReason)
                .then(() => {})
                .catch((err) => {
                    console.log(err);
                });
        } else {
            throw new Error(errorReason);
        }
        return;
    }

    try {
        await backupToNetwork(localbackup.outputPath);
        location = "server";
    } catch (error) {
        backupError = error;
    }

    const lastBackup = await updateLastBackupDate(
        localbackup.fileName,
        localbackup.fileSize,
        location
    );

    if (backupError) {
        let errorReason = backupError.message || "Failed to backup data to network";
        if (!fromApi) {
            sendBackupFailedMail(errorReason)
                .then(() => {})
                .catch((err) => {
                    console.log(err);
                });
        } else {
            throw new Error(errorReason);
        }
    }

    return { lastBackup };
}

if (require.main === module) {
    backupDatabase();
}

module.exports = { backupDatabase, BACKUP_DIR };
