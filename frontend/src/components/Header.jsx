import { useContext, useState, useEffect } from "react";
import { Link } from "react-router";
import { Menu, Sun, Moon } from "lucide-react";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import { navigateTo } from "../utils/navigate";
import { formatDateTime, makeAvatarName } from "../utils/helperFunctions";
import toaster from "../utils/toaster";
import SpinnerButton from "./ui/spinner-button";

const Header = () => {
    const {
        user,
        setUser,
        isSidebarOpen,
        setIsSidebarOpen,
        lastBackup,
        setLastBackup,
    } = useContext(Context);

    const [isOpen, setIsOpen] = useState(false);
    const [isBackUpLoading, setIsBackUpLoading] = useState(false);

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") || "light";
    });

    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    const handleLogout = async () => {
        try {
            await apiService.post("/users/signout");
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            navigateTo("/");
            setIsOpen(false);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleBackup = async () => {
        setIsBackUpLoading(true);
        try {
            const res = await apiService.post("/users/manual-backup");
            if (res.success) {
                setLastBackup(res.data.lastBackup);
            }

            setIsOpen(false);
            toaster("success", "Backup created successfully");
        } catch (error) {
            const errMsg =
                error.response.data.message || "Failed to create backup";
            toaster("error", errMsg);
            console.error("Backup failed:", error);
        } finally {
            setIsBackUpLoading(false);
        }
    };

    return (
        <header className="w-full px-4 py-3 border-b border-gray-200/80 dark:border-border shadow-xs flex items-center justify-between bg-white dark:bg-card">
            <div className="flex items-center gap-3">
                {/* Hamburger Menu - Only visible on mobile/tablet */}
                {user && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                )}
                <Link
                    to={user ? "/dashboard" : "/"}
                    className="flex items-center gap-3"
                >
                    <div className="p-1 rounded-full">
                        <img src="/icon.png" alt="Logo" className="h-9 w-9" />
                    </div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Asset Monitoring System
                    </h1>
                </Link>
            </div>

            <div className="flex items-center gap-3">
                {/* Theme Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="cursor-pointer text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={
                        theme === "light"
                            ? "Switch to Dark Mode"
                            : "Switch to Light Mode"
                    }
                >
                    {theme === "light" ? (
                        <Moon className="h-5 w-5 text-blue-900" />
                    ) : (
                        <Sun className="h-5 w-5 text-yellow-600" />
                    )}
                </Button>

                {user && (
                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger className="cursor-pointer hidden lg:block">
                            <div className="flex items-center justify-center bg-blue-500 text-white rounded-full h-9 w-9 cursor-pointer">
                                <p className="pointer-events-none">
                                    {makeAvatarName(user.name)}
                                </p>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <Button
                                variant="ghost"
                                className="w-full text-left cursor-pointer"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                            {user.role == "admin" && (
                                <>
                                    <div className="h-[1px] w-full bg-gray-200 dark:bg-gray-800" />
                                    <SpinnerButton
                                        variant="ghost"
                                        className="w-full text-left cursor-pointer"
                                        onClick={handleBackup}
                                        loading={isBackUpLoading}
                                        loadingText="Backing Up..."
                                    >
                                        Backup
                                    </SpinnerButton>
                                    <div className="mb-2 h-[1px] w-full bg-gray-200 dark:bg-gray-800" />
                                    <p className="text-xs text-muted-foreground text-center">
                                        Last backup:{" "}
                                        <b>
                                            {lastBackup
                                                ? formatDateTime(
                                                      new Date(lastBackup)
                                                  )
                                                : "N/A"}
                                        </b>
                                    </p>
                                </>
                            )}
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        </header>
    );
};

export default Header;
