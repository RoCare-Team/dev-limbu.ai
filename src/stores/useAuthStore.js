import { create } from "zustand";

export const useAuthStore = create((set) => ({
    isLoggedIn: false,
    isModalOpen: false, // Manage the Book Demo modal state here
    selectedVideo: null, // New: Stores the video URL string or null


    setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
    setSelectedVideo: (videoUrl) => set({ selectedVideo: videoUrl }),

    checkAuth: () => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            set({ isLoggedIn: !!token });
        }
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("fullName");
        localStorage.removeItem("mobileNumber");
        set({ isLoggedIn: false });
        window.location.replace("/login");
    },
}));