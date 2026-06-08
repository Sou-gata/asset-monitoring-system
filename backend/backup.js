const fs = require("fs-extra");
const path = require("path");
const { sendBackupFailedMail } = require("./controllers/mail.controller");
require("dotenv").config();
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const pool = require("./utils/dbConnect");
const { getSqlDate } = require("./utils/helperFunctions");

const BACKUP_DIR = path.join(__dirname, "backups");

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

async function backupDatabase(fromApi = false) {
    await fs.ensureDir(BACKUP_DIR);
    const mysqldumpPath =
        '"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"';

    const timestamp = getTimeStamp();
    const fileName = `backup_${process.env.DB_NAME}_${timestamp}.sql`;
    const outputPath = path.join(BACKUP_DIR, fileName);

    const cmd = `${mysqldumpPath} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${outputPath}"`;

    try {
        const { stderr } = await execPromise(cmd);
        if (stderr) {
            // console.warn("MySQL Warning/Notes:", stderr);
        }
        const lastBackup = await updateLastBackupDate();
        return { lastBackup, fileName };
    } catch (error) {
        if (fromApi) {
            throw error;
        } else {
            sendBackupFailedMail()
                .then(() => {})
                .catch((err) => {
                    console.log(err);
                });
        }
    }
}

async function updateLastBackupDate() {
    const tableName = `config_a1b2c3d4`;
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
        return timestamp;
    } catch (error) {
        console.error("Error updating last backup date:", error);
        return false;
    }
}

if (require.main === module) {
    backupDatabase();
}

module.exports = { backupDatabase };
