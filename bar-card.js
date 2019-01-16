class BarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }

    // Remove shadowroot if lastChild.
    const root = this.shadowRoot;
    if (root.lastChild) root.removeChild(root.lastChild);

    // Card variables
    const cardConfig = Object.assign({}, config);
    if (!cardConfig.height) cardConfig.height = "40px";
    if (!cardConfig.from) cardConfig.from = "left";
    if (!cardConfig.rounding) cardConfig.rounding = "3px";
    if (!cardConfig.width) cardConfig.width = "70%";
    if (!cardConfig.indicator) cardConfig.indicator = true;
    if (!cardConfig.min) cardConfig.min = 0;
    if (!cardConfig.max) cardConfig.max = 100;
    if (!cardConfig.title_position) cardConfig.title_position = "left";

    if(cardConfig.bar_style){
      var barStyle = this._customStyle(cardConfig.bar_style)
    }
    if(cardConfig.title_style){
      var titleStyle = this._customStyle(cardConfig.title_style)
    }
    if(cardConfig.indicator_style){
      var indicatorStyle = this._customStyle(cardConfig.indicator_style)
    }
    let titlePosition;
    let barPosition;
    switch(cardConfig.title_position){
      case "left":
        titlePosition = "left: 0px;";
        barPosition = "right: 0px;";
        break;
      case "right":
        titlePosition = "right: 0px;";
        barPosition = "left: 0px;";
        break;
    }

    // Config adjustments.
    cardConfig.width = cardConfig.width.replace("%","");
    if (cardConfig.from == "left") cardConfig.from = "right";
    else cardConfig.from = "left";

    // Create card elements.
    const card = document.createElement('ha-card');
    const background = document.createElement('div');
    background.id = "background";
    const bar = document.createElement('div');
    bar.id = "bar";
    const value = document.createElement('div');
    value.id = "value";
    const indicator = document.createElement('div');
    indicator.id = "indicator";
    const title = document.createElement('div');
    title.id = "title";
    const titleBar = document.createElement('div');
    titleBar.id = "titleBar";
    title.textContent = cardConfig.title;
    const style = document.createElement('style');
    style.textContent = `
      ha-card {
        text-align: center;
        height: ${cardConfig.height};
        background-color: var(--paper-card-background-color);
        --base-unit: ${cardConfig.height};
        padding: 2px;
        padding-right: 4px;
        position: relative;
      }
      #indicator {
        height: ${cardConfig.height};  
        line-height: ${cardConfig.height}; 
        opacity: 0.25;
        color: #000000;
        padding-right: 5px;
        padding-left: 5px;
        position: absolute;
        `+indicatorStyle+`
      }
      #bar {
        position: absolute;
        `+barPosition+`
        display: table-cell;
        height: ${cardConfig.height};
        width: ${cardConfig.width}%;
        --bar-direction: ${cardConfig.from};
        --bar-percent: 50%;
        --bar-charge-percent: 0%;
        --bar-charge-color: #000000;
        --bar-fill-color: var(--label-badge-blue);
        background: linear-gradient(to ${cardConfig.from}, var(--bar-fill-color) var(--bar-percent), var(--bar-charge-color) var(--bar-percent), var(--bar-charge-color) var(--bar-charge-percent), var(--bar-background-color) var(--bar-percent), var(--bar-background-color) var(--bar-percent));
        border-radius: ${cardConfig.rounding};
        `+barStyle+`
      }
      #value {
        height: 100%;
        line-height: ${cardConfig.height};
        font-size: 14px;
        font-weight: bold;
        color: #FFFFFF;
        text-shadow: 1px 1px #000000;
        `+barStyle+`
      }
      #title {
        display: table-cell;
        height: ${cardConfig.height};
        width: ${100-cardConfig.width}%;
        text-align: left;
        font-size: 14px;
        vertical-align: middle;
        color: var(--primary-text-color);
        padding-left: 10px;
        padding-right: 10px;
        `+titleStyle+`
      }
      #titleBar {
        position: absolute;
        `+titlePosition+`
        height: ${cardConfig.height};
        width: ${100-cardConfig.width}%;
        `+titleStyle+`
      }
    `;

    // Build card.
    bar.appendChild(indicator);   
    bar.appendChild(value);
    titleBar.appendChild(title);
    card.appendChild(titleBar);
    card.appendChild(bar);
    card.appendChild(style);
    card.addEventListener('click', event => {
      this._fire('hass-more-info', { entityId: cardConfig.entity });
    });
    root.appendChild(card);
    this._config = cardConfig;
  }

  _customStyle(style){
    let styleString = "";

    Object.keys(style).forEach(section => {
        styleString = styleString + section + ":" + style[section] + "; ";
    });
    return styleString;
  }

  // Translates entity percentage to bar percentage.
  _translatePercent(value, min, max) {
    return 100 * (value - min) / (max - min);
  }

  // Map range function.
  _scale(num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  }

  // Create animation.
  _animation(entityState, configDirection, configDuration, hue, saturation, configStop) {
    const config = this._config;
    const root = this.shadowRoot;
    const element = root.getElementById("bar");
    if (!config.speed) config.speed = 1000;

    let currentPercent = this._translatePercent(entityState, config.min, config.max);
    let totalFrames = ((currentPercent)*10)+(config.delay/(config.speed/250));
    let scaledPercent = (currentPercent)*10;

    if(configStop == true){
      configDuration = 0;
    }

    let options = {
    iterations: Infinity,
    iterationStart: 0,
    delay: 0,
    endDelay: 0,
    direction: 'normal',
    duration: configDuration,
    fill: 'both',
    }
    
    let keyframes = [];
    let i = scaledPercent;
      if (configDirection == 'normal'){
        for(; i <= totalFrames; ){    
            let brightness = this._scale(i/10, currentPercent, currentPercent+25, 50, 15);
            if(brightness <= 15) brightness = 15;
            let keyframe = {"--bar-charge-percent": i/10+"%", "--bar-percent": currentPercent+"%", "--bar-charge-color": "hsla("+hue+","+saturation+","+brightness+"%,0.5)"};
          keyframes.push(keyframe);
          i++;
        }
      }
      if(configDirection == 'reverse'){
        for(; i <= totalFrames; ){    
          const reversePercent = currentPercent - ((i-scaledPercent)/10);
          let brightness = this._scale(i/10, currentPercent, currentPercent+25, 30, 50);
          if(brightness >= 50) brightness = 50;
          let keyframe = {"--bar-charge-percent": currentPercent+"%","--bar-percent": reversePercent+"%", "--bar-charge-color": "hsla("+hue+","+saturation+","+brightness+"%,1)"};
        keyframes.push(keyframe);
        i++;
        }
      }
      element.animate(keyframes, options);
  }

  // Attributes action
  _fire(type, detail, options) {
    const node = this.shadowRoot;
    options = options || {};
    detail = (detail === null || detail === undefined) ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
  }

  // Returns hue value based on severity array
  _computeSeverity(stateValue, sections) {
    let numberValue = Number(stateValue);
    let hue;
    sections.forEach(section => {
      if (numberValue <= section.value && !hue) {
        hue = section.hue;
      }
    });
    return hue;
  }
  
  // Create card
  set hass(hass) {
    const config = this._config;
    if (!config.saturation) config.saturation = "50%";
    if (!config.delay) config.delay = 5000;
    if(!config.animation)config.animation = 'auto';
    if(!config.indicator)config.indicator = true;

    const root = this.shadowRoot;

    // 
    let entityState;
    if(hass.states[config.entity] == undefined || hass.states[config.entity].state == "unknown") entityState = "N/A";
    else {
      entityState = hass.states[config.entity].state;
      entityState = Math.min(entityState, config.max);
      entityState = Math.max(entityState, config.min);
    }
    let measurement
    if(hass.states[config.entity] == undefined || hass.states[config.entity].state == "unknown") measurement = "";
    else measurement = hass.states[config.entity].attributes.unit_of_measurement || "";
    let hue;
    if(!config.severity) {
      hue = 220;
      if(config.hue){
        hue = config.hue;
      }
    }
    else{
      hue = this._computeSeverity(entityState, config.severity);
    }

    // Set style variables
    const color = 'hsl('+hue+','+config.saturation+',50%)';
    const backgroundColor = 'hsla('+hue+','+config.saturation+',15%,0.5)';
    const chargeColor = 'hsla('+hue+','+config.saturation+',30%,0.5)';

    // Select 'auto' animation.
    if(config.animation == 'auto'){
      if (entityState > this._entityState) {
        root.getElementById("indicator").style.setProperty('right', 0);
        root.getElementById("indicator").style.removeProperty('left');
        root.getElementById("indicator").textContent = '▲';
        this._animation(entityState, 'normal', config.delay, hue, config.saturation, false);
      }
      if (entityState < this._entityState) {
        root.getElementById("indicator").style.setProperty('left', 0);
        root.getElementById("indicator").style.removeProperty('right');
        root.getElementById("indicator").textContent = '▼';
        this._animation(entityState, 'reverse', config.delay, hue, config.saturation, false);
      }
      if (entityState == config.max || entityState == config.min) {
        root.getElementById("indicator").style.removeProperty('right');
        root.getElementById("indicator").style.removeProperty('left');
        root.getElementById("indicator").textContent = '';
        if(entityState == config.max){
          root.getElementById("bar").style.setProperty('--bar-percent', '100%');
          root.getElementById("bar").style.setProperty('--bar-fill-color', color);
          root.getElementById("bar").style.setProperty('--bar-charge-percent', '100%');
          this._animation(entityState, 'normal', config.delay, hue, config.saturation, true);
        }
        if(entityState == config.min){
          root.getElementById("bar").style.setProperty('--bar-percent', '0%');
          root.getElementById("bar").style.setProperty('--bar-charge-percent', '0%');
          this._animation(entityState, 'normal', config.delay, hue, config.saturation, true);
        }
      }
    }
    
    // Select 'charge' animation.
    if(config.animation == 'charge'){
      let chargeEntityState;
      if(!config.charge_entity){
        entityState = "define 'charge_entity'";
        measurement = "";
        root.getElementById("value").style.setProperty('color', '#FF0000');
      }else{
          chargeEntityState = hass.states[config.charge_entity].state;
      }
      if (chargeEntityState == "charging" || chargeEntityState =="on" || chargeEntityState == "true") {
        root.getElementById("indicator").style.setProperty('right', 0);
        root.getElementById("indicator").textContent = '▲';
        this._animation(entityState, 'normal', config.delay, hue, config.saturation, false);
      }
      if (chargeEntityState == "discharging" || chargeEntityState =="off" || chargeEntityState == "false") {
        root.getElementById("indicator").style.setProperty('left', 0);
        root.getElementById("indicator").textContent = '▼';
        this._animation(entityState, 'reverse', config.delay, hue, config.saturation, false);
      }
    }

    if (entityState !== this._entityState) {
      if (config.min !== undefined && config.max !== undefined) {
        root.getElementById("bar").style.setProperty('--bar-percent', `${this._translatePercent(entityState, config.min, config.max)}%`);
        root.getElementById("bar").style.setProperty('--bar-charge-percent', `${this._translatePercent(entityState, config.min, config.max)}%`);
      }
      root.getElementById("bar").style.setProperty('--bar-fill-color', color);
      root.getElementById("bar").style.setProperty('--bar-background-color', backgroundColor);
      root.getElementById("bar").style.setProperty('--bar-charge-color', chargeColor);
      root.getElementById("value").textContent = `${entityState} ${measurement}`;
    }
    root.lastChild.hass = hass;
    this._entityState = entityState;
  }
  getCardSize() {
    return 1;
  }
}

customElements.define('bar-card', BarCard);