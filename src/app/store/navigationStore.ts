import { create } from 'zustand'

interface NavState {
    rightMode: string;
    setRightMode: (mode: string) => void;
    centerMode: string;
    setCenterMode: (mode: string) => void;
    activeTab: number;
    setActiveTab: (tab: number) => void;
}

export const useNavStore = create<NavState>((set) => ({
    rightMode: 'default',
    setRightMode: (mode) => set({ rightMode: mode }),
    centerMode: 'characters',
    setCenterMode: (mode) => set({ centerMode: mode }),
    activeTab: 0,
    setActiveTab: (tab) => set({ activeTab: tab }),
}))


