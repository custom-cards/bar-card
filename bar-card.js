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
    //const config = Object.assign({}, config);
    if (!config.height) config.height = "40px";
    if (!config.from) config.from = "left";
    if (!config.rounding) config.rounding = "3px";
    if (!config.width) config.width = "70%";
    if (!config.min) config.min = 0;
    if (!config.max) config.max = 100;
    if (!config.title_position) config.title_position = "left";
    if (!config.indicator) config.indicator = "auto";

    if(config.bar_style){
      var barStyle = this._customStyle(config.bar_style)
    }
    if(config.title_style){
      var titleStyle = this._customStyle(config.title_style)
    }
    if(config.indicator_style){
      var indicatorStyle = this._customStyle(config.indicator_style)
    }
    if(config.card_style){
      var cardStyle = this._customStyle(config.card_style)
    }
    let titlePosition;
    let barPosition;
    switch(config.title_position){
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
    if (config.from == "left") config.from = "right";
    else config.from = "right";

    if(config.title_position == "inside"){
      config.width = "100%";

    }

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
    title.textContent = config.title;
    const style = document.createElement('style');
    style.textContent = `
      ha-card {
        background-color: var(--paper-card-background-color);
        padding: 4px;
        `+cardStyle+`
      }
      #background {
        position: relative;
        height: ${config.height};
      }
      #indicator {
        height: ${config.height};  
        line-height: ${config.height}; 
        opacity: 0.25;
        color: #000000;
        padding-right: 5px;
        padding-left: 5px;
        position: absolute;
        text-shadow: 0px 0px;
        `+indicatorStyle+`
      }
      #bar {
        position: absolute;
        height: ${config.height};
        color: #FFF;
        text-align: center;
        font-weight: bold;
        text-shadow: 1px 1px #000;
        border-radius: 3px;
        width: ${config.width};
        `+barPosition+`
        --bar-direction: ${config.from};
        --bar-percent: 50%;
        --bar-charge-percent: 0%;
        --bar-charge-color: #000000;
        --bar-fill-color: var(--label-badge-blue);
        background: linear-gradient(to ${config.from}, var(--bar-fill-color) var(--bar-percent), var(--bar-charge-color) var(--bar-percent), var(--bar-charge-color) var(--bar-charge-percent), var(--bar-background-color) var(--bar-percent), var(--bar-background-color) var(--bar-percent));
        border-radius: ${config.rounding};
        `+barStyle+`
      }
      #value {
        white-space: pre;
        display: table-cell;
        height: ${config.height};
        width: 1000px;
        vertical-align: middle;
        font-weight: bold;
        color: #FFF;
        text-shadow: 1px 1px #000000;
        `+barStyle+`
      }
      #title {
        display: table-cell;
        height: ${config.height};
        width: calc(100% - ${config.width});
        font-size: 14px;
        vertical-align: middle;
        color: var(--primary-text-color);
        padding-left: 10px;
        padding-right: 10px;
        text-align: left;
        `+titleStyle+`
      }
      #titleBar {
        position: absolute;
        `+titlePosition+`
        height: ${config.height};
        width: calc(100% - ${config.width});
        `+titleStyle+`
      }
    `;

    // Build card.
    if(config.indicator != "off"){
      bar.appendChild(indicator); 
    } 
    bar.appendChild(value);
    if(config.title_position != "inside"){
      titleBar.appendChild(title);
      background.appendChild(titleBar);      
    }
    background.appendChild(bar);
    card.appendChild(background);
    card.appendChild(style);
    card.addEventListener('click', event => {
      this._fire('hass-more-info', { entityId: config.entity });
    });
    root.appendChild(card);
    this._config = config;
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
      return element.animate(keyframes, options);
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
        switch(config.indicator){
          case "auto":
          case "right":
            root.getElementById("indicator").style.setProperty('right', 0);
            root.getElementById("indicator").style.removeProperty('left');
            break;
          case "left":
            root.getElementById("indicator").style.setProperty('left', 0);
            root.getElementById("indicator").style.removeProperty('right');
            break;
        }
        if(config.indicator != "off"){
          root.getElementById("indicator").textContent = '▲';
        }
        if(!this._currentAnimation || entityState > this._entityState){
          this._currentAnimation = this._animation(entityState, 'normal', config.delay, hue, config.saturation, false);
        }
      }
      if (entityState < this._entityState) {
        switch(config.indicator){
          case "right":
            root.getElementById("indicator").style.setProperty('right', 0);
            root.getElementById("indicator").style.removeProperty('left');
            break;
          case "auto":
          case "left":
            root.getElementById("indicator").style.setProperty('left', 0);
            root.getElementById("indicator").style.removeProperty('right');
            break;
        }
        if(config.indicator != "off"){
        root.getElementById("indicator").textContent = '▼';
        }
        if(!this._currentAnimation || entityState < this._entityState){
          this._currentAnimation = this._animation(entityState, 'reverse', config.delay, hue, config.saturation, false);
        }
      }
      if (entityState == config.max || entityState == config.min) {
        if(config.indicator != "off"){
          root.getElementById("indicator").style.removeProperty('right');
          root.getElementById("indicator").style.removeProperty('left');
          root.getElementById("indicator").textContent = '';
        }
        if(entityState == config.max){
          root.getElementById("bar").style.setProperty('--bar-percent', '100%');
          root.getElementById("bar").style.setProperty('--bar-fill-color', color);
          root.getElementById("bar").style.setProperty('--bar-charge-percent', '100%');
          if(!this._currentAnimation){
            this._currentAnimation = this._animation(entityState, 'normal', config.delay, hue, config.saturation, true);
          }
        }
        if(entityState == config.min){
          root.getElementById("bar").style.setProperty('--bar-percent', '0%');
          root.getElementById("bar").style.setProperty('--bar-charge-percent', '0%');
          if(!this._currentAnimation){
            this._currentAnimation = this._animation(entityState, 'normal', config.delay, hue, config.saturation, true);
          }
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
          chargeEntityState = config.charge_entity;
      }
      if (chargeEntityState == "charging" || chargeEntityState =="on" || chargeEntityState == "true") {
        switch(config.indicator){
          case "auto":
          case "right":
            root.getElementById("indicator").style.setProperty('right', 0);
            root.getElementById("indicator").style.removeProperty('left');
            break;
          case "left":
            root.getElementById("indicator").style.setProperty('left', 0);
            root.getElementById("indicator").style.removeProperty('right');
            break;
        }
        if(config.indicator != "off"){
        root.getElementById("indicator").textContent = '▲';
        }
        if(!this._currentAnimation || chargeEntityState != this._currentChargeState || entityState > this._entityState){
          this._currentChargeState = chargeEntityState;
          this._currentAnimation = this._animation(entityState, 'normal', config.delay, hue, config.saturation, false);
        }
      }
      if (chargeEntityState == "discharging" || chargeEntityState =="off" || chargeEntityState == "false") {
        switch(config.indicator){
          case "right":
            root.getElementById("indicator").style.setProperty('right', 0);
            root.getElementById("indicator").style.removeProperty('left');
            break;
          case "auto":
          case "left":
            root.getElementById("indicator").style.setProperty('left', 0);
            root.getElementById("indicator").style.removeProperty('right');
            break;
        }
        if(config.indicator != "off"){
        root.getElementById("indicator").textContent = '▼';
        }
        if(!this._currentAnimation || chargeEntityState != this._currentChargeState || entityState < this._entityState){
          this._currentChargeState = chargeEntityState;
          this._currentAnimation = this._animation(entityState, 'reverse', config.delay, hue, config.saturation, false);
        }
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
      if(config.title_position == "inside"){
        root.getElementById("value").textContent = `${config.title} \r\n${entityState} ${measurement}`;
      }
      else{
        root.getElementById("value").textContent = `${entityState} ${measurement}`;
      }
    }
    root.lastChild.hass = hass;
    this._entityState = entityState;
  }
  getCardSize() {
    return 1;
  }
}

customElements.define('bar-card', BarCard);
