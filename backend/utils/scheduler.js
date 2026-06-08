const cron = require("node-cron");
const {
    checkExpDate,
    checkSubmissionDate,
    sendRunningMail,
} = require("../controllers/mail.controller");
const { backupDatabase } = require("../backup");

const initScheduler = () => {
    cron.schedule(
        "0 6,18 * * *",
        () => {
            checkExpDate();
            checkSubmissionDate();
            backupDatabase();
        },
        {
            timezone: "Asia/Kolkata",
        }
    );
    cron.schedule(
        "0 5 * * *",
        () => {
            sendRunningMail();
        },
        {
            timezone: "Asia/Kolkata",
        }
    );
};

module.exports = { initScheduler };
