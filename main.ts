import './main.css';
import { Game } from './src/game';

declare global {
    interface Window {
        Ammo: () => Promise<any>;
    }
}

async function main() {
    const Ammo = await window.Ammo();
    new Game(Ammo);
}

main();