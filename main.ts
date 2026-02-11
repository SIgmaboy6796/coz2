import './main.css';
import Ammo from 'ammo.js';
import { Game } from './src/game';

async function main() {
    const AmmoModule = await Ammo();
    new Game(AmmoModule);
}

main();