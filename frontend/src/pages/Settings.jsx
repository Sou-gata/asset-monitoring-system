import { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import SpinnerButton from "../components/ui/spinner-button";
import {
    Save,
    CalendarClock,
    FileText,
    Database,
    Mail,
    Settings as SettingsIcon,
    Activity,
} from "lucide-react";
import { validateEmail } from "../utils/helperFunctions";
import toaster from "../utils/toaster";
import apiService from "../utils/apiService";

const Settings = () => {
    const [inputs, setInputs] = useState({
        exp_days: "",
        exp_emails: "",
        submission_days: "",
        submission_emails: "",
        backup_fail_email: "",
        exp_text: "",
        submission_text: "",
        backup_fail_text: "",
        running_emails: "",
    });
    const [loading, setIsLoading] = useState({
        loading: false,
        disabled: false,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Stringify thresholds to safely call trim()
        const expDaysStr = String(inputs.exp_days ?? "");
        const subDaysStr = String(inputs.submission_days ?? "");

        if (
            !expDaysStr.trim() ||
            !inputs.exp_emails?.trim() ||
            !subDaysStr.trim() ||
            !inputs.submission_emails?.trim() ||
            !inputs.backup_fail_email?.trim() ||
            !inputs.backup_fail_text?.trim() ||
            !inputs.exp_text?.trim() ||
            !inputs.submission_text?.trim() ||
            !inputs.running_emails?.trim()
        ) {
            toaster("error", "Please fill all required fields");
            return;
        }

        let emails = inputs.exp_emails.split(",");
        for (let i = emails.length - 1; i >= 0; i--) {
            if (!emails[i].trim()) {
                emails.splice(i, 1);
                continue;
            }
            emails[i] = emails[i].trim();
            if (!validateEmail(emails[i])) {
                toaster(
                    "error",
                    "Invalid email format in Expiry Notifications"
                );
                return;
            }
        }
        const exp_emails = emails.join(",");

        emails = inputs.submission_emails.split(",");
        for (let i = emails.length - 1; i >= 0; i--) {
            if (!emails[i].trim()) {
                emails.splice(i, 1);
                continue;
            }
            emails[i] = emails[i].trim();
            if (!validateEmail(emails[i])) {
                toaster(
                    "error",
                    "Invalid email format in Submission Notifications"
                );
                return;
            }
        }
        const submission_emails = emails.join(",");

        emails = inputs.backup_fail_email.split(",");
        for (let i = emails.length - 1; i >= 0; i--) {
            if (!emails[i].trim()) {
                emails.splice(i, 1);
                continue;
            }
            emails[i] = emails[i].trim();
            if (!validateEmail(emails[i])) {
                toaster(
                    "error",
                    "Invalid email format in Backup Failure Notifications"
                );
                return;
            }
        }
        const backup_fail_email = emails.join(",");

        emails = inputs.running_emails.split(",");
        for (let i = emails.length - 1; i >= 0; i--) {
            if (!emails[i].trim()) {
                emails.splice(i, 1);
                continue;
            }
            emails[i] = emails[i].trim();
            if (!validateEmail(emails[i])) {
                toaster(
                    "error",
                    "Invalid email format in Service Status Reports"
                );
                return;
            }
        }
        const running_emails = emails.join(",");

        if (
            parseInt(inputs.exp_days) < 0 ||
            parseInt(inputs.submission_days) < 0
        ) {
            toaster("error", "Please enter valid positive days");
            return;
        }

        const data = {
            exp_days: parseInt(inputs.exp_days),
            exp_emails: exp_emails,
            submission_days: parseInt(inputs.submission_days),
            submission_emails: submission_emails,
            backup_fail_email: backup_fail_email,
            backup_fail_text: inputs.backup_fail_text,
            submission_text: inputs.submission_text,
            exp_text: inputs.exp_text,
            running_emails: running_emails,
        };

        setIsLoading((prev) => ({ ...prev, loading: true }));
        try {
            const response = await apiService.post("/config/update", data);
            if (response.success) {
                toaster("success", "Settings updated successfully");
            } else {
                toaster("error", "Failed to update settings");
            }
        } catch (error) {
            const errMsg = error?.response?.data?.message || error.message;
            toaster("error", errMsg);
        } finally {
            setIsLoading((prev) => ({ ...prev, loading: false }));
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await apiService.get("/config");

            if (response.success) {
                setInputs(response.data);
            } else {
                toaster("error", "Failed to fetch settings");
                setIsLoading((prev) => ({ ...prev, disabled: true }));
            }
        } catch (error) {
            console.log(error);
            setIsLoading((prev) => ({ ...prev, disabled: true }));
            toaster("error", "Failed to fetch settings");
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2">
                        <SettingsIcon className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                        System Settings
                    </h2>
                </div>
            </div>

            <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 p-4 sm:p-5 bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-xl shadow-xs">

            {/* Notification alert cards container */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Expiry Alert Settings Card */}
                    <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-gray-200/60 dark:border-border/50 rounded-xl p-4 flex flex-col gap-3 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200/60 dark:border-gray-800">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                                <CalendarClock className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                    Asset Expiry Alerts
                                </h2>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Days Threshold */}
                            <div className="flex flex-col gap-1">
                                <Label
                                    htmlFor="exp_days"
                                    className="text-gray-700 dark:text-gray-300 font-medium text-xs"
                                >
                                    Alert Trigger (Days)
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="exp_days"
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 30"
                                        value={inputs.exp_days}
                                        onChange={(e) =>
                                            setInputs({
                                                ...inputs,
                                                exp_days: e.target.value,
                                            })
                                        }
                                        className="pr-12"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                                        days before
                                    </span>
                                </div>
                            </div>

                            {/* Recipients Emails */}
                            <div className="flex flex-col gap-1">
                                <Label
                                    htmlFor="exp_emails"
                                    className="text-gray-700 dark:text-gray-300 font-medium text-xs flex items-center justify-between"
                                >
                                    <span>Recipient Email Addresses</span>
                                    <span className="text-[9px] text-gray-400 font-normal">
                                        Comma-separated
                                    </span>
                                </Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Mail className="w-3.5 h-3.5" />
                                    </div>
                                    <Input
                                        id="exp_emails"
                                        type="text"
                                        placeholder="admin@example.com, user@example.com"
                                        value={inputs.exp_emails}
                                        onChange={(e) =>
                                            setInputs({
                                                ...inputs,
                                                exp_emails: e.target.value,
                                            })
                                        }
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Email template text */}
                            <div className="flex flex-col gap-1">
                                <Label
                                    htmlFor="exp_text"
                                    className="text-gray-700 dark:text-gray-300 font-medium text-xs"
                                >
                                    Email Body Message
                                </Label>
                                <Textarea
                                    id="exp_text"
                                    placeholder="The following assets are about to expire..."
                                    value={inputs.exp_text}
                                    onChange={(e) =>
                                        setInputs({
                                            ...inputs,
                                            exp_text: e.target.value,
                                        })
                                    }
                                    className="min-h-16 text-xs resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submission Alert Settings Card */}
                    <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-gray-200/60 dark:border-border/50 rounded-xl p-4 flex flex-col gap-3 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200/60 dark:border-gray-800">
                            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                    Asset Submission Alerts
                                </h2>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Days Threshold */}
                            <div className="flex flex-col gap-1">
                                <Label
                                    htmlFor="submission_days"
                                    className="text-gray-700 dark:text-gray-300 font-medium text-xs"
                                >
                                    Alert Trigger (Days)
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="submission_days"
                                        type="number"
                                        min="0"
                                        placeholder="e.g. 7"
                                        value={inputs.submission_days}
                                        onChange={(e) =>
                                            setInputs({
                                                ...inputs,
                                                submission_days: e.target.value,
                                            })
                                        }
                                        className="pr-12"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                                        days before
                                    </span>
                                </div>
                            </div>

                            {/* Recipients Emails */}
                            <div className="flex flex-col gap-1">
                                <Label
                                    htmlFor="submission_emails"
                                    className="text-gray-700 dark:text-gray-300 font-medium text-xs flex items-center justify-between"
                                >
                                    <span>Recipient Email Addresses</span>
                                    <span className="text-[9px] text-gray-400 font-normal">
                                        Comma-separated
                                    </span>
                                </Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Mail className="w-3.5 h-3.5" />
                                    </div>
                                    <Input
                                        id="submission_emails"
                                        type="text"
                                        placeholder="admin@example.com, manager@example.com"
                                        value={inputs.submission_emails}
                                        onChange={(e) =>
                                            setInputs({
                                                ...inputs,
                                                submission_emails:
                                                    e.target.value,
                                            })
                                        }
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Email template text */}
                            <div className="flex flex-col gap-1">
                                <Label
                                    htmlFor="submission_text"
                                    className="text-gray-700 dark:text-gray-300 font-medium text-xs"
                                >
                                    Email Body Message
                                </Label>
                                <Textarea
                                    id="submission_text"
                                    placeholder="The following allocated assets are due for submission..."
                                    value={inputs.submission_text}
                                    onChange={(e) =>
                                        setInputs({
                                            ...inputs,
                                            submission_text: e.target.value,
                                        })
                                    }
                                    className="min-h-16 text-xs resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Backup Failure Alerts Card */}
                    <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-gray-200/60 dark:border-border/50 rounded-xl p-4 flex flex-col gap-3 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200/60 dark:border-gray-800">
                            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
                                <Database className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                    Backup Failure Alerts
                                </h2>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Recipients Emails */}
                            <div className="flex flex-col gap-1">
                                <Label
                                    htmlFor="backup_fail_email"
                                    className="text-gray-700 dark:text-gray-300 font-medium text-xs flex items-center justify-between"
                                >
                                    <span>Recipient Email Addresses</span>
                                    <span className="text-[9px] text-gray-400 font-normal">
                                        Comma-separated
                                    </span>
                                </Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Mail className="w-3.5 h-3.5" />
                                    </div>
                                    <Input
                                        id="backup_fail_email"
                                        type="text"
                                        placeholder="admin@example.com"
                                        value={inputs.backup_fail_email}
                                        onChange={(e) =>
                                            setInputs({
                                                ...inputs,
                                                backup_fail_email:
                                                    e.target.value,
                                            })
                                        }
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Email template text */}
                            <div className="flex flex-col gap-1">
                                <Label
                                    htmlFor="backup_fail_text"
                                    className="text-gray-700 dark:text-gray-300 font-medium text-xs"
                                >
                                    Email Body Message
                                </Label>
                                <Textarea
                                    id="backup_fail_text"
                                    placeholder="Alert: The scheduled system backup has failed..."
                                    value={inputs.backup_fail_text}
                                    onChange={(e) =>
                                        setInputs({
                                            ...inputs,
                                            backup_fail_text: e.target.value,
                                        })
                                    }
                                    className="min-h-16 text-xs resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Service Status Reports Card */}
                    <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-gray-200/60 dark:border-border/50 rounded-xl p-4 flex flex-col gap-3 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-gray-200/60 dark:border-gray-800">
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Activity className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                    Service Status Reports
                                </h2>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 h-full justify-between">
                            {/* Recipients Emails */}
                            <div className="flex flex-col gap-1">
                                <Label
                                    htmlFor="running_emails"
                                    className="text-gray-700 dark:text-gray-300 font-medium text-xs flex items-center justify-between"
                                >
                                    <span>Recipient Email Addresses</span>
                                    <span className="text-[9px] text-gray-400 font-normal">
                                        Comma-separated
                                    </span>
                                </Label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Mail className="w-3.5 h-3.5" />
                                    </div>
                                    <Input
                                        id="running_emails"
                                        type="text"
                                        placeholder="admin@example.com, manager@example.com"
                                        value={inputs.running_emails}
                                        onChange={(e) =>
                                            setInputs({
                                                ...inputs,
                                                running_emails: e.target.value,
                                            })
                                        }
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Save Button */}
                <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
                    <SpinnerButton
                        className="cursor-pointer shadow-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm"
                        loading={loading.loading}
                        onClick={handleSubmit}
                        disabled={loading.loading || loading.disabled}
                        loadingText="Saving..."
                    >
                        <Save className="w-4 h-4" />
                        Save Settings
                    </SpinnerButton>
                </div>
            </form>
        </div>
        </div>
    );
};

export default Settings;
