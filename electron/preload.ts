import { contextBridge } from 'electron';

// No APIs exposed to the renderer yet. The contextBridge is wired so future
// milestones can expose a typed, minimal surface without changing the setup.
contextBridge.exposeInMainWorld('villainous', {});

export {};
