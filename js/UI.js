/**
 * UI Class
 * Manages DOM interactions and binds simulation parameters to the UI.
 */
class UI {
    constructor(config, onReset, onRandomize, onClearObstacles, mouse) {
        this.config = config;
        this.onReset = onReset;
        this.onRandomize = onRandomize;
        this.onClearObstacles = onClearObstacles;
        this.mouse = mouse;
        this.elements = {};
        
        this.init();
    }

    init() {
        const ids = [
            'boid-count', 'max-speed', 'sep-weight', 'sep-radius',
            'ali-weight', 'ali-radius', 'coh-weight', 'coh-radius',
            'predator-toggle', 'fear-radius', 'show-radii',
            'reset-btn', 'random-btn', 'interaction-mode', 
            'clear-obs-btn', 'speed-factor'
        ];

        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        this.bindEvents();
        this.updateDisplays();
    }

    bindEvents() {
        // Range inputs
        const rangeInputs = [
            'boid-count', 'max-speed', 'sep-weight', 'sep-radius',
            'ali-weight', 'ali-radius', 'coh-weight', 'coh-radius',
            'fear-radius', 'speed-factor'
        ];

        rangeInputs.forEach(id => {
            this.elements[id].addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                const key = this.idToConfigKey(id);
                this.config[key] = val;
                this.updateDisplay(id, val);
                
                if (id === 'boid-count' && this.onReset) {
                    this.onReset();
                }
            });
        });

        // Interaction Mode
        this.elements['interaction-mode'].addEventListener('change', (e) => {
            this.mouse.mode = e.target.value;
        });

        // Toggles
        this.elements['predator-toggle'].addEventListener('change', (e) => {
            this.config.predatorActive = e.target.checked;
        });

        this.elements['show-radii'].addEventListener('change', (e) => {
            this.config.showRadii = e.target.checked;
        });

        // Buttons
        this.elements['reset-btn'].addEventListener('click', () => {
            if (this.onReset) this.onReset();
        });

        this.elements['random-btn'].addEventListener('click', () => {
            if (this.onRandomize) {
                this.onRandomize();
                this.updateAllInputs();
            }
        });

        this.elements['clear-obs-btn'].addEventListener('click', () => {
            if (this.onClearObstacles) this.onClearObstacles();
        });
    }

    idToConfigKey(id) {
        const mapping = {
            'boid-count': 'boidCount',
            'max-speed': 'maxSpeed',
            'sep-weight': 'sepWeight',
            'sep-radius': 'sepRadius',
            'ali-weight': 'aliWeight',
            'ali-radius': 'aliRadius',
            'coh-weight': 'cohWeight',
            'coh-radius': 'cohRadius',
            'fear-radius': 'fearRadius',
            'speed-factor': 'speedFactor'
        };
        return mapping[id];
    }

    updateDisplay(id, val) {
        const display = document.getElementById(`${id}-val`);
        if (display) display.textContent = val;
    }

    updateDisplays() {
        const rangeInputs = [
            'boid-count', 'max-speed', 'sep-weight', 'sep-radius',
            'ali-weight', 'ali-radius', 'coh-weight', 'coh-radius',
            'fear-radius'
        ];
        rangeInputs.forEach(id => {
            const key = this.idToConfigKey(id);
            this.updateDisplay(id, this.config[key]);
        });
    }

    updateAllInputs() {
        const rangeInputs = [
            'boid-count', 'max-speed', 'sep-weight', 'sep-radius',
            'ali-weight', 'ali-radius', 'coh-weight', 'coh-radius',
            'fear-radius'
        ];
        rangeInputs.forEach(id => {
            const key = this.idToConfigKey(id);
            this.elements[id].value = this.config[key];
            this.updateDisplay(id, this.config[key]);
        });
        
        this.elements['predator-toggle'].checked = this.config.predatorActive;
        this.elements['show-radii'].checked = this.config.showRadii;
    }

    setFPS(fps) {
        document.getElementById('fps-counter').textContent = Math.round(fps);
    }

    setBoidCount(count) {
        document.getElementById('boid-counter').textContent = count;
    }
}

export default UI;
