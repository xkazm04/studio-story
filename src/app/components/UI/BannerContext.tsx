import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BannerOption {
  title: string;
  description: string;
  button: string;
  action?: () => void;
  imageUrl?: string;
}

interface BannerContextType {
  id: string;
  title: string;
  subtitle: string;
  options: BannerOption[];
  isVisible: boolean;
  showBanner: (title: string, subtitle: string, options: BannerOption[]) => void;
  hideBanner: () => void;
  minimizeBanner: () => void;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export const BannerProvider = ({ children }: { children: ReactNode }) => {
  const [id, setId] = useState<string>('banner-' + Date.now());
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [options, setOptions] = useState<BannerOption[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const showBanner = (title: string, subtitle: string, options: BannerOption[]) => {
    const newId = 'banner-' + Date.now();
    setId(newId);
    setTitle(title);
    setSubtitle(subtitle);
    setOptions(options);
    setIsVisible(true);
    setIsExpanded(false);
  };

  const hideBanner = () => {
    setIsVisible(false);
  };

  const minimizeBanner = () => {
    setIsExpanded(false);
  }

  return (
    <BannerContext.Provider value={{
      id,
      title,
      subtitle,
      options,
      isVisible,
      showBanner,
      hideBanner,
      minimizeBanner,
      isExpanded,
      setIsExpanded
    }}>
      {children}
    </BannerContext.Provider>
  );
};

export const useBanner = () => {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
};


