import { create } from 'zustand';

export interface SalesChannel {
  id: string;
  provider: string;
  nickname: string;
  region: string;
  fba?: boolean;
}

interface SalesChannelsStore {
  channels: SalesChannel[];
  
  // Channel methods
  addChannel: (channel: Omit<SalesChannel, 'id'>) => void;
  removeChannel: (id: string) => void;
  updateChannel: (id: string, updates: Partial<SalesChannel>) => void;
  getChannel: (id: string) => SalesChannel | undefined;
  getChannelsByProvider: (provider: string) => SalesChannel[];
  clearChannels: () => void;
}

export const useSalesChannelsStore = create<SalesChannelsStore>()((set, get) => ({
  channels: [],

  addChannel: (channelData) => {
    const newChannel: SalesChannel = {
      ...channelData,
      id: `${channelData.provider}-${Date.now()}`,
    };
    
    set((state) => ({
      channels: [...state.channels, newChannel],
    }));
  },

  removeChannel: (id) => {
    set((state) => ({
      channels: state.channels.filter(channel => channel.id !== id),
    }));
  },

  updateChannel: (id, updates) => {
    set((state) => ({
      channels: state.channels.map(channel =>
        channel.id === id ? { ...channel, ...updates } : channel
      ),
    }));
  },

  getChannel: (id) => {
    return get().channels.find(channel => channel.id === id);
  },

  getChannelsByProvider: (provider) => {
    return get().channels.filter(channel => channel.provider === provider);
  },

  clearChannels: () => {
    set({ channels: [] });
  },
}));
