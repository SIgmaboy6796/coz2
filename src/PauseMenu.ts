export interface GameSettings {
    sensitivity: number;
    keybinds: {
        forward: string;
        backward: string;
        left: string;
        right: string;
        jump: string;
        pickup: string;
        throw: string;
    };
}

export class PauseMenu {
    private container: HTMLDivElement | null = null;
    private isVisible = false;
    private settings: GameSettings;
    private onClose: (() => void) | null = null;

    constructor(private defaultSettings: GameSettings) {
        this.settings = JSON.parse(JSON.stringify(defaultSettings));
    }

    public show(onClose: () => void) {
        this.onClose = onClose;
        this.isVisible = true;
        this.render();
        document.body.style.overflow = 'hidden';
    }

    public hide() {
        this.isVisible = false;
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        document.body.style.overflow = 'auto';
    }

    public toggle(onClose: () => void) {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show(onClose);
        }
    }

    public getSettings(): GameSettings {
        return this.settings;
    }

    public setOnEscapeClose(onClose: () => void) {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
                onClose();
            }
        });
    }

    private render() {
        if (this.container) {
            this.container.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'pause-menu';
        this.container.innerHTML = `
            <style>
                #pause-menu {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    font-family: Arial, sans-serif;
                }
                
                .pause-content {
                    background: rgba(20, 20, 30, 0.95);
                    padding: 40px;
                    border-radius: 15px;
                    color: white;
                    min-width: 400px;
                    box-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
                    border: 2px solid rgba(100, 150, 255, 0.5);
                }
                
                .pause-title {
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 30px;
                    text-align: center;
                    color: #6496ff;
                }
                
                .settings-section {
                    margin-bottom: 25px;
                }
                
                .setting-label {
                    font-size: 16px;
                    margin-bottom: 8px;
                    color: #ccc;
                }
                
                .setting-input {
                    width: 100%;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(100, 150, 255, 0.3);
                    color: white;
                    border-radius: 5px;
                    font-size: 14px;
                }
                
                .setting-input:focus {
                    outline: none;
                    border-color: #6496ff;
                    box-shadow: 0 0 10px rgba(100, 150, 255, 0.3);
                }
                
                .keybinds-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-top: 15px;
                }
                
                .keybind-item {
                    display: flex;
                    flex-direction: column;
                }
                
                .keybind-label {
                    font-size: 12px;
                    color: #999;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                }
                
                .keybind-input {
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(100, 150, 255, 0.3);
                    color: white;
                    border-radius: 5px;
                    font-size: 13px;
                    text-align: center;
                }
                
                .button-group {
                    display: flex;
                    gap: 10px;
                    margin-top: 30px;
                }
                
                .pause-button {
                    flex: 1;
                    padding: 12px;
                    background: linear-gradient(135deg, #6496ff 0%, #4070dd 100%);
                    border: 1px solid rgba(100, 150, 255, 0.5);
                    color: white;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .pause-button:hover {
                    background: linear-gradient(135deg, #7aa6ff 0%, #5080ee 100%);
                    box-shadow: 0 0 15px rgba(100, 150, 255, 0.5);
                }
                
                .pause-button:active {
                    transform: scale(0.98);
                }
                
                .reset-button {
                    background: linear-gradient(135deg, #ff6464 0%, #dd4040 100%);
                    border-color: rgba(255, 100, 100, 0.5);
                }
                
                .reset-button:hover {
                    background: linear-gradient(135deg, #ff7a7a 0%, #ee5050 100%);
                    box-shadow: 0 0 15px rgba(255, 100, 100, 0.5);
                }
                
                .sensitivity-display {
                    display: inline-block;
                    margin-left: 10px;
                    color: #6496ff;
                    font-weight: bold;
                }
            </style>
            <div class="pause-content">
                <div class="pause-title">⏸ PAUSED</div>
                
                <div class="settings-section">
                    <div class="setting-label">Mouse Sensitivity <span class="sensitivity-display">${this.settings.sensitivity.toFixed(2)}</span></div>
                    <input type="range" id="sensitivity-slider" class="setting-input" min="0.01" max="0.2" step="0.01" value="${this.settings.sensitivity}">
                </div>
                
                <div class="settings-section">
                    <div class="setting-label">Keybinds</div>
                    <div class="keybinds-grid">
                        <div class="keybind-item">
                            <div class="keybind-label">Forward</div>
                            <input type="text" class="keybind-input" id="key-forward" value="${this.settings.keybinds.forward}" readonly>
                        </div>
                        <div class="keybind-item">
                            <div class="keybind-label">Backward</div>
                            <input type="text" class="keybind-input" id="key-backward" value="${this.settings.keybinds.backward}" readonly>
                        </div>
                        <div class="keybind-item">
                            <div class="keybind-label">Left</div>
                            <input type="text" class="keybind-input" id="key-left" value="${this.settings.keybinds.left}" readonly>
                        </div>
                        <div class="keybind-item">
                            <div class="keybind-label">Right</div>
                            <input type="text" class="keybind-input" id="key-right" value="${this.settings.keybinds.right}" readonly>
                        </div>
                        <div class="keybind-item">
                            <div class="keybind-label">Jump</div>
                            <input type="text" class="keybind-input" id="key-jump" value="${this.settings.keybinds.jump}" readonly>
                        </div>
                        <div class="keybind-item">
                            <div class="keybind-label">Pickup</div>
                            <input type="text" class="keybind-input" id="key-pickup" value="${this.settings.keybinds.pickup}" readonly>
                        </div>
                        <div class="keybind-item">
                            <div class="keybind-label">Throw</div>
                            <input type="text" class="keybind-input" id="key-throw" value="${this.settings.keybinds.throw}" readonly>
                        </div>
                    </div>
                </div>
                
                <div class="button-group">
                    <button class="pause-button" id="resume-btn">Resume</button>
                    <button class="pause-button reset-button" id="reset-btn">Reset to Defaults</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.attachEventListeners();
    }

    private attachEventListeners() {
        const sensitivitySlider = document.getElementById('sensitivity-slider') as HTMLInputElement;
        const resumeBtn = document.getElementById('resume-btn') as HTMLButtonElement;
        const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

        if (sensitivitySlider) {
            sensitivitySlider.addEventListener('input', (e) => {
                this.settings.sensitivity = parseFloat((e.target as HTMLInputElement).value);
                // Update display
                const display = this.container?.querySelector('.sensitivity-display');
                if (display) {
                    display.textContent = this.settings.sensitivity.toFixed(2);
                }
            });
        }

        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.hide();
                if (this.onClose) {
                    this.onClose();
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
                this.render();
                this.attachEventListeners();
            });
        }
    }
}
