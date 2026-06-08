const ApiErrorResponce = require("../utils/ApiErrorResponce");
const ApiResponse = require("../utils/ApiResponse");
const pool = require("../utils//dbConnect");

async function updateConfig(req, res) {
    const {
        exp_days,
        exp_emails,
        submission_days,
        submission_emails,
        backup_fail_email,
        exp_text,
        submission_text,
        backup_fail_text,
        running_emails,
    } = req.body;
    if (
        exp_days === undefined ||
        !exp_emails ||
        submission_days === undefined ||
        !submission_emails ||
        !backup_fail_email ||
        !exp_text ||
        !submission_text ||
        !backup_fail_text ||
        !running_emails
    ) {
        return res
            .status(400)
            .json(new ApiErrorResponce(400, {}, "All fields are required"));
    }
    try {
        const query = `
            UPDATE config_a1b2c3d4 
            SET value = CASE config_key
                WHEN 'exp_days'          THEN ?
                WHEN 'exp_emails'        THEN ?
                WHEN 'submission_days'   THEN ?
                WHEN 'submission_emails' THEN ?
                WHEN 'backup_fail_email' THEN ?
                WHEN 'exp_text'          THEN ?
                WHEN 'submission_text'   THEN ?
                WHEN 'backup_fail_text'  THEN ?
                WHEN 'running_emails'    THEN ?
                ELSE value
            END
            WHERE config_key IN ('exp_days', 'exp_emails', 'submission_days', 'submission_emails', 'backup_fail_email', 'exp_text', 'submission_text', 'backup_fail_text', 'running_emails')
        `;
        const params = [
            exp_days,
            exp_emails,
            submission_days,
            submission_emails,
            backup_fail_email,
            exp_text,
            submission_text,
            backup_fail_text,
            running_emails,
        ];
        await pool.query(query, params);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Config updated successfully"));
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json(new ApiErrorResponce(500, {}, "Internal server error"));
    }
}

async function getConfig(req, res) {
    try {
        const [rows] = await pool.query(`SELECT * FROM config_a1b2c3d4`);
        const data = {};
        rows.forEach((row) => {
            data[row.config_key] = row.value;
        });
        return res
            .status(200)
            .json(new ApiResponse(200, data, "Config fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(
            new ApiErrorResponce(500, {}, "Internal server error")
        );
    }
}

async function getLastBackup(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT \`value\` FROM config_a1b2c3d4 WHERE config_key = 'last_backup'`
        );
        if (rows.length > 0) {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        { lastBackup: rows[0].value },
                        "Last backup fetched successfully"
                    )
                );
        } else {
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        { lastBackup: null },
                        "Last backup not found"
                    )
                );
        }
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json(new ApiErrorResponce(500, {}, "Internal server error"));
    }
}

module.exports = {
    updateConfig,
    getConfig,
    getLastBackup,
};
