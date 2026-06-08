import { useContext, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Button } from "./ui/button";
import { ChevronRight, ChevronLeft, X, LogOut, Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "./ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaTachometerAlt,
    FaCubes,
    FaPlusSquare,
    FaListAlt,
    FaUsers,
    FaUserPlus,
    FaQrcode,
    FaUserShield,
    FaBoxes,
    FaHistory,
} from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { BsTrash3Fill } from "react-icons/bs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

import { Context } from "../utils/Context";
import apiService from "../utils/apiService";
import { navigateTo } from "../utils/navigate";
import { makeAvatarName } from "../utils/helperFunctions";

const navItems = [
    {
        name: "Dashboard",
        path: "/dashboard",
        icon: <FaTachometerAlt className="w-3 h-3" />,
    },
    {
        name: "Asset Master",
        icon: <FaCubes className="w-3 h-3" />,
        children: [
            {
                name: "Assets List",
                path: "/asset-list",
                icon: <FaListAlt className="w-3 h-3" />,
            },
            {
                name: "Add Assets",
                path: "/add-asset",
                icon: <FaPlusSquare className="w-3 h-3" />,
                adminOnly: true,
            },
            {
                name: "Disposed Assets",
                path: "/disposed-assets",
                icon: <BsTrash3Fill className="w-3 h-3" />,
                adminOnly: true,
            },
        ],
    },
    {
        name: "Asset Allocation",
        path: "/asset-allocation",
        icon: <FaBoxes className="w-3 h-3" />,
        children: [
            {
                name: "Allocation List",
                path: "/allocation-list",
                icon: <FaListAlt className="w-3 h-3" />,
            },
            {
                name: "New Allocation",
                path: "/add-allocation",
                icon: <FaPlusSquare className="w-3 h-3" />,
            },
            {
                name: "Allocation History",
                path: "/allocation-history",
                icon: <FaHistory className="w-3 h-3" />,
            },
        ],
    },
    {
        name: "Employee Master",
        icon: <FaUsers className="w-3 h-3" />,
        children: [
            {
                name: "Employee List",
                path: "/employee-list",
                icon: <FaListAlt className="w-3 h-3" />,
            },
            {
                name: "Add Employee",
                path: "/add-employee",
                icon: <FaUserPlus className="w-3 h-3" />,
                adminOnly: true,
            },
        ],
    },
    {
        name: "QR Code",
        path: "/qr-code",
        icon: <FaQrcode className="w-3 h-3" />,
    },
    {
        name: "Role Settings",
        path: "/role-settings",
        icon: <FaUserShield className="w-3 h-3" />,
        adminOnly: true,
    },
    {
        name: "Settings",
        path: "/settings",
        icon: <IoMdSettings className="w-3 h-3" />,
        adminOnly: true,
    },
];

const Sidebar = () => {
    const { user, setUser, isSidebarOpen, setIsSidebarOpen } =
        useContext(Context);
    const location = useLocation();
    const [openMenu, setOpenMenu] = useState(() => {
        // Automatically open the menu that has the active page on load
        const activeItem = navItems.find(
            (item) =>
                item.children &&
                item.children.some((sub) => sub.path === location.pathname)
        );
        return activeItem ? activeItem.name : null;
    });
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activePopover, setActivePopover] = useState(null);
    const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

    const toggleMenu = (name) => {
        setOpenMenu((prev) => (prev === name ? null : name));
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleLogout = async () => {
        try {
            await apiService.post("/users/signout");
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            navigateTo("/");
            closeSidebar();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <>
            {/* Backdrop for mobile - only shows when sidebar is open */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    bg-white dark:bg-card border-r border-gray-200/80 dark:border-border flex flex-col py-2 px-1.5 transition-all duration-300 overflow-hidden
                    ${isCollapsed ? "w-14" : "w-56"}
                    fixed top-0 left-0 bottom-0 h-screen
                    lg:relative lg:top-auto lg:bottom-auto lg:h-full lg:max-h-full
                    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                    z-50 lg:z-auto
                `}
            >
                {/* Header with collapse/close buttons */}
                <div
                    className={`flex items-center mb-2 pl-2 ${
                        isCollapsed
                            ? "justify-center px-0 pl-0"
                            : "justify-between"
                    }`}
                >
                    {/* Close button for mobile */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeSidebar}
                        className="lg:hidden text-gray-500 dark:text-gray-400"
                        aria-label="Close sidebar"
                    >
                        <X className="h-5 w-5" />
                    </Button>

                    {/* Collapse/Expand button for desktop */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`hidden lg:flex text-gray-500 dark:text-gray-400 ${isCollapsed ? "" : "mr-2"}`}
                    >
                        {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-2">
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => {
                            const isAdminOnly = item.adminOnly;
                            const isVisibleToUser =
                                !isAdminOnly || user?.role === "admin";

                            if (!isVisibleToUser) return null;

                            if (isCollapsed) {
                                if (item.children) {
                                    const isActiveParent = item.children.some(
                                        (sub) => sub.path === location.pathname
                                    );

                                    return (
                                        <Popover
                                            key={item.name}
                                            open={activePopover === item.name}
                                            onOpenChange={(open) =>
                                                setActivePopover(
                                                    open ? item.name : null
                                                )
                                            }
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className={`w-full flex ps-5 justify-center cursor-pointer py-1 h-10 ${
                                                        isActiveParent
                                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50"
                                                            : "text-gray-700 dark:text-gray-300"
                                                    }`}
                                                    title={item.name}
                                                >
                                                    {item.icon}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                side="right"
                                                className="w-56 p-2 ml-2 bg-white dark:bg-card border border-gray-200/80 dark:border-border"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="px-2 py-1.5 text-sm font-semibold border-b mb-1 text-gray-900 dark:text-gray-100 border-gray-100 dark:border-gray-800">
                                                        {item.name}
                                                    </div>
                                                    {item.children.map(
                                                        (sub) => {
                                                            const isSubAdminOnly =
                                                                sub.adminOnly;
                                                            const showSub =
                                                                !isSubAdminOnly ||
                                                                user?.role ===
                                                                    "admin";

                                                            if (!showSub)
                                                                return null;

                                                            return (
                                                                <NavLink
                                                                    key={
                                                                        sub.path
                                                                    }
                                                                    to={
                                                                        sub.path
                                                                    }
                                                                    onClick={() => {
                                                                        setActivePopover(
                                                                            null
                                                                        );
                                                                        closeSidebar();
                                                                    }}
                                                                    className={({
                                                                        isActive,
                                                                    }) =>
                                                                        `flex items-center rounded-md px-2 py-2 text-sm transition-colors ${
                                                                            isActive
                                                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                                                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60"
                                                                        }`
                                                                    }
                                                                >
                                                                    {sub.icon}
                                                                    <span className="ml-2">
                                                                        {
                                                                            sub.name
                                                                        }
                                                                    </span>
                                                                </NavLink>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    );
                                }

                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={closeSidebar}
                                        className={({ isActive }) =>
                                            `flex items-center rounded-lg transition-colors justify-center ${
                                                isActive
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60"
                                            }`
                                        }
                                    >
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-center text-sm cursor-pointer py-1 h-10 text-gray-700 dark:text-gray-300"
                                            title={item.name}
                                        >
                                            {item.icon}
                                        </Button>
                                    </NavLink>
                                );
                            }

                            if (item.children) {
                                return (
                                    <div key={item.name}>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-between text-sm cursor-pointer py-1 flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                                            onClick={() =>
                                                toggleMenu(item.name)
                                            }
                                        >
                                            <div className="flex items-center">
                                                {item.icon}
                                                <span className="ms-2">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <motion.div
                                                animate={{
                                                    rotate:
                                                        openMenu === item.name
                                                            ? 90
                                                            : 0,
                                                }}
                                                transition={{ duration: 0.2 }}
                                                className="flex items-center justify-center"
                                            >
                                                <ChevronRight className="w-3 h-3 text-gray-500" />
                                            </motion.div>
                                        </Button>

                                        <AnimatePresence initial={false}>
                                            {openMenu === item.name && (
                                                <motion.div
                                                    initial="collapsed"
                                                    animate="open"
                                                    exit="collapsed"
                                                    variants={{
                                                        open: {
                                                            opacity: 1,
                                                            height: "auto",
                                                        },
                                                        collapsed: {
                                                            opacity: 0,
                                                            height: 0,
                                                        },
                                                    }}
                                                    transition={{
                                                        duration: 0.2,
                                                        ease: "easeInOut",
                                                    }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="ml-4 flex flex-col gap-1 pt-1 pb-1">
                                                        {item.children.map(
                                                            (sub) => {
                                                                const isSubAdminOnly =
                                                                    sub.adminOnly;
                                                                const showSub =
                                                                    !isSubAdminOnly ||
                                                                    user?.role ===
                                                                        "admin";

                                                                return showSub ? (
                                                                    <NavLink
                                                                        key={
                                                                            sub.path
                                                                        }
                                                                        to={
                                                                            sub.path
                                                                        }
                                                                        onClick={
                                                                            closeSidebar
                                                                        }
                                                                        className={({
                                                                            isActive,
                                                                        }) =>
                                                                            `flex items-center rounded-lg transition-colors ${
                                                                                isActive
                                                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                                                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60"
                                                                            }`
                                                                        }
                                                                    >
                                                                        <Button
                                                                            variant="ghost"
                                                                            className="w-full justify-start text-sm cursor-pointer px-4 py-1 font-normal text-gray-700 dark:text-gray-300 hover:bg-transparent"
                                                                        >
                                                                            {
                                                                                sub.icon
                                                                            }
                                                                            {
                                                                                sub.name
                                                                            }
                                                                        </Button>
                                                                    </NavLink>
                                                                ) : null;
                                                            }
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            }

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={closeSidebar}
                                    className={({ isActive }) =>
                                        `flex items-center rounded-lg transition-colors ${
                                            isActive
                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60"
                                        }`
                                    }
                                >
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-sm cursor-pointer px-4 py-1 text-gray-700 dark:text-gray-300 hover:bg-transparent"
                                    >
                                        {item.icon}
                                        {item.name}
                                    </Button>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Section - fixed, doesn't scroll */}
                <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1 flex-shrink-0">
                    {/* About System Button */}
                    <Button
                        variant="ghost"
                        onClick={() => setAboutDialogOpen(true)}
                        className={`w-full flex items-center text-sm cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-200 ${
                            isCollapsed
                                ? "justify-center h-10 px-0"
                                : "justify-start px-4 py-2 gap-3"
                        }`}
                        title="About System"
                    >
                        <Info className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        {!isCollapsed && (
                            <span className="font-medium">About System</span>
                        )}
                    </Button>

                    {/* User Profile Footer - Only visible on mobile/tablet */}
                    <div className="lg:hidden">
                        <div className="flex items-center gap-3 px-2 py-3 border-t border-gray-100 dark:border-gray-800/50 mt-1">
                            {/* Avatar */}
                            <div className="flex items-center justify-center bg-blue-500 text-white rounded-full h-10 w-10 flex-shrink-0">
                                <p className="text-sm font-semibold">
                                    {makeAvatarName(user?.name || "")}
                                </p>
                            </div>

                            {/* User Info and Logout */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {user?.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.role}
                                </p>
                            </div>

                            {/* Logout Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="flex-shrink-0 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                                aria-label="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* About System Dialog */}
            <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
                <DialogContent showCloseButton={true} className="sm:max-w-md">
                    <div className="flex flex-col items-center text-center space-y-4 pt-2">
                        {/* Beautiful Icon Wrapper */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-full border border-blue-100 dark:border-blue-900/40">
                            <img
                                src="/icon.png"
                                alt="App Logo"
                                className="h-12 w-12"
                            />
                        </div>

                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Asset Monitoring System
                            </DialogTitle>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full inline-block">
                                Version 2.1
                            </p>
                        </div>

                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                            A professional and premium asset monitoring and
                            management system designed to track, allocate, and
                            audit company assets with efficiency and accuracy.
                        </DialogDescription>
                    </div>

                    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Developer & Support Details
                        </h4>

                        <div className="bg-gray-50 dark:bg-neutral-900/50 rounded-lg p-3.5 text-xs space-y-3 border border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Developed By
                                </span>
                                <a
                                    href="http://gbtsolutions.in/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                                >
                                    GBT Tech Solutions Private Limited
                                </a>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Support Email
                                </span>
                                <a
                                    href="mailto:software.support@gbtsolutions.in"
                                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                                >
                                    software.support@gbtsolutions.in
                                </a>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white border-0"
                            onClick={() => setAboutDialogOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Sidebar;
