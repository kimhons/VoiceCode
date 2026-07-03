/**
 * VoiceCode Client
 * Handles communication with the VoiceCode desktop app
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface VoiceCodeStatus {
    connected: boolean;
    isDictating: boolean;
    streamingMode: 'instant' | 'enhanced' | 'hybrid';
    language: string;
    latencyMs: number;
}

export interface TranscriptionResult {
    id: string;
    text: string;
    isFinal: boolean;
    confidence: number;
    latencyMs: number;
    enhanced: boolean;
}

export interface CommandResult {
    success: boolean;
    action: string;
    originalText?: string;
    newText?: string;
    message?: string;
}

export interface CodeGenerationResult {
    code: string;
    language: string;
    explanation?: string;
}

export interface VoiceCodeConfig {
    streamingMode?: string;
    codeVocabulary?: boolean;
    naturalLanguageCommands?: boolean;
    punctuationMode?: string;
}

type EventMap = {
    'transcription': TranscriptionResult;
    'command': CommandResult;
    'status': VoiceCodeStatus;
    'error': Error;
    'connected': void;
    'disconnected': void;
};

export class VoiceCodeClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private apiEndpoint: string;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private status: VoiceCodeStatus = {
        connected: false,
        isDictating: false,
        streamingMode: 'hybrid',
        language: 'en-US',
        latencyMs: 0
    };

    constructor(apiEndpoint: string) {
        super();
        this.apiEndpoint = apiEndpoint;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const wsUrl = this.apiEndpoint.replace('http', 'ws') + '/ws';

            try {
                this.ws = new WebSocket(wsUrl);

                this.ws.on('open', () => {
                    this.status.connected = true;
                    this.emit('connected');
                    this.clearReconnectTimer();
                    resolve();
                });

                this.ws.on('message', (data: WebSocket.Data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleMessage(message);
                    } catch (e) {
                        console.error('Failed to parse WebSocket message:', e);
                    }
                });

                this.ws.on('close', () => {
                    this.status.connected = false;
                    this.emit('disconnected');
                    this.scheduleReconnect();
                });

                this.ws.on('error', (error) => {
                    this.emit('error', error);
                    if (!this.status.connected) {
                        reject(error);
                    }
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    disconnect(): void {
        this.clearReconnectTimer();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.status.connected = false;
    }

    private handleMessage(message: { type: string; payload?: unknown }): void {
        switch (message.type) {
            case 'transcription':
                this.emit('transcription', message.payload as TranscriptionResult);
                break;
            case 'command_result':
                this.emit('command', message.payload as CommandResult);
                break;
            case 'status':
                this.status = { ...this.status, ...(message.payload as Partial<VoiceCodeStatus>) };
                this.emit('status', this.status);
                break;
            case 'error':
                this.emit('error', new Error((message.payload as { message: string }).message));
                break;
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) {
            return;
        }
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect().catch(console.error);
        }, 5000);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    async send(type: string, payload?: unknown): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('Not connected to VoiceCode');
        }
        this.ws.send(JSON.stringify({ type, payload }));
    }

    async startDictation(): Promise<void> {
        await this.send('start_dictation');
        this.status.isDictating = true;
    }

    async stopDictation(): Promise<void> {
        await this.send('stop_dictation');
        this.status.isDictating = false;
    }

    async executeCommand(command: string): Promise<CommandResult> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Command timeout'));
            }, 30000);

            const handler = (result: CommandResult) => {
                clearTimeout(timeout);
                this.removeListener('command', handler);
                resolve(result);
            };

            this.on('command', handler);
            this.send('execute_command', { command }).catch(reject);
        });
    }

    async generateCode(description: string, language?: string): Promise<CodeGenerationResult> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Code generation timeout'));
            }, 60000);

            const handler = (message: { type: string; payload: CodeGenerationResult }) => {
                if (message.type === 'code_generated') {
                    clearTimeout(timeout);
                    resolve(message.payload);
                }
            };

            // Type assertion since we're handling raw messages
            this.on('message' as keyof EventMap, handler as () => void);

            this.send('generate_code', { description, language }).catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    async explainCode(code: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Explanation timeout'));
            }, 60000);

            const handler = (message: { type: string; payload: { explanation: string } }) => {
                if (message.type === 'code_explained') {
                    clearTimeout(timeout);
                    resolve(message.payload.explanation);
                }
            };

            this.on('message' as keyof EventMap, handler as () => void);

            this.send('explain_code', { code }).catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    async refactorCode(code: string, instructions: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Refactoring timeout'));
            }, 60000);

            const handler = (message: { type: string; payload: { code: string } }) => {
                if (message.type === 'code_refactored') {
                    clearTimeout(timeout);
                    resolve(message.payload.code);
                }
            };

            this.on('message' as keyof EventMap, handler as () => void);

            this.send('refactor_code', { code, instructions }).catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    async addCustomTerm(term: string, aliases: string[]): Promise<void> {
        await this.send('add_custom_term', { term, aliases, category: 'custom' });
    }

    async getStatus(): Promise<VoiceCodeStatus> {
        return this.status;
    }

    async getDictationHistory(): Promise<TranscriptionResult[]> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('History request timeout'));
            }, 10000);

            const handler = (message: { type: string; payload: TranscriptionResult[] }) => {
                if (message.type === 'history') {
                    clearTimeout(timeout);
                    resolve(message.payload);
                }
            };

            this.on('message' as keyof EventMap, handler as () => void);

            this.send('get_history').catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    updateConfig(config: VoiceCodeConfig): void {
        this.send('update_config', config).catch(console.error);
    }

    isConnected(): boolean {
        return this.status.connected;
    }

    isDictating(): boolean {
        return this.status.isDictating;
    }
}
