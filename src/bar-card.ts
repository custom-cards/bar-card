console.info(`%cBAR-CARD\n%cVersion: 3.0.6`, 'color: #4788d4; font-weight: bold;', '');

export interface config {
  animation: any;
  attribute: any;
  color: string;
  columns: number;
  decimal: any;
  direction: string;
  entity: string;
  entities: any;
  entity_row: boolean;
  height: string;
  icon: any;
  limit_value: boolean;
  max: number;
  min: number;
  positions: any;
  service_options: { domain: string; service: string; data: any };
  severity: any;
  stack: string;
  tap_action: string;
  target: any;
  title: string;
  unit_of_measurement: string;
  visibility: string;
  width: string;
}

class BarCard extends HTMLElement {
  shadowRoot: any;
  _configArray!: any[];
  _hass: any;
  _config: any;
  _animationDirection: any;
  _entityState: any;
  _entityTarget: any;
  _currentMin: any;
  _currentMax: any;
  _currentAnimation: any;
  _currentChargeState: any;
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  // Set config object.
  setConfig(config: config) {
    while (this.shadowRoot.lastChild) this.shadowRoot.removeChild(this.shadowRoot.lastChild);

    // Default Card variables
    const defaultConfig = {
      attribute: false,
      animation: {
        state: 'off',
        delay: 5000,
        speed: 1000
      },
      color: 'var(--bar-card-color, var(--primary-color))',
      columns: false,
      decimal: false,
      direction: 'right',
      height: '40px',
      entity_row: false,
      icon: false,
      limit_value: false,
      max: 100,
      min: 0,
      name: false,
      positions: {
        icon: 'outside',
        indicator: 'outside',
        title: 'inside',
        minmax: 'off',
        value: 'inside'
      },
      severity: false,
      service_options: false,
      stack: 'vertical',
      tap_action: 'info',
      target: false,
      title: false,
      unit_of_measurement: false
    };

    // Define default and config positions object.
    let defaultConfigPositions = defaultConfig.positions;
    let configPositions = config.positions;

    // Define default and config animation object.
    let defaultConfigAnimation = defaultConfig.animation;
    let configAnimation = config.animation;

    // Merge default and card config.
    config = Object.assign(defaultConfig, config);

    if (config.columns) config.stack = 'horizontal';

    // Merge positions config.
    config.positions = Object.assign(defaultConfigPositions, configPositions);

    // Merge animation config.
    config.animation = Object.assign(defaultConfigAnimation, configAnimation);

    // Check entity types
    let updateArray;
    if (config.entities) {
      let newArray: any = [];
      config.entities.forEach((section: string) => {
        let type = typeof section;
        if (type == 'string') {
          let constructObject = { entity: section };
          newArray.push(constructObject);
          updateArray = true;
        } else if (type == 'object') {
          newArray.push(section);
          updateArray = true;
        }
      });
      if (updateArray == true) {
        config.entities = newArray;
      }
    } else if (config.entity) {
      config.entities = [{ entity: config.entity }];
    }

    // Define card container
    const haCard = document.createElement('ha-card');
    const states = document.createElement('div');
    states.id = 'states';
    states.classList.add('card-content');
    const header = document.createElement('div');
    header.classList.add('card-header');
    const name = document.createElement('div');
    name.classList.add('name');
    const haCardStyle = document.createElement('style');
    let direction;
    switch (config.stack) {
      case 'horizontal':
        direction = 'row';
        break;
      case 'vertical':
        direction = 'column';
    }
    switch (config.entity_row) {
      case false:
        haCardStyle.textContent = `
        ha-card {
          display: flex;
          align-items: stretch;
          flex-direction: column;
        }
        row {
          margin: 8px 0px;
          display: flex;
          flex-direction: columns;
        }
      `;
        break;
      case true:
        haCardStyle.textContent = `
        ha-card {
          display: flex;
          align-items: stretch;
          flex-direction: ${direction};
          background: #0000;
          box-shadow: none;
        }
      `;
        break;
    }

    // For each entity in entities list create cardElements.
    this._configArray = [];

    // If columns is defined create rows otherwise create individual bars.
    if (config.columns) {
      const rowAmount = Math.ceil(config.entities.length / config.columns);

      // Create array containing amount of bars per row.
      let columnsArray = [];
      for (let i = 0; i < config.entities.length; i++) {
        if (((columnsArray.length + 1) * config.columns) == i) {
          columnsArray.push(config.columns);
        }
        if (config.entities.length == i + 1) {
          columnsArray.push(config.entities.length - (columnsArray.length * config.columns));
        }
      }

      // Create each row element and add contained bars.
      let currentBar = 0;
      for (let i = 0; i < rowAmount; i++) {
        const row = document.createElement('row');
        row.id = 'row_' + i;

        // For each row add contained bars based on columnsArray.
        for (let x = 0; x < columnsArray[i]; x++) {
          const entityName = config.entities[currentBar].entity.split('.');
          const duplicatedConfig = Object.assign({}, config);

          // Merge default config with per entity config.
          this._configArray[currentBar] = Object.assign(duplicatedConfig, config.entities[i]);

          // Add bar to current row.
          row.appendChild(this._cardElements(this._configArray[currentBar], entityName[0] + '_' + entityName[1] + '_' + currentBar, config.entities[currentBar].entity));
          currentBar++;
        }

        // Add current row to states.
        states.appendChild(row);
      }
    } else {
      for (let i = 0; i <= config.entities.length - 1; i++) {
        const entityName = config.entities[i].entity.split('.');
        const duplicatedConfig = Object.assign({}, config);

        // Merge default config with per entity config.
        this._configArray[i] = Object.assign(duplicatedConfig, config.entities[i]);

        // Add bar to either ha-card or states element.
        switch (config.entity_row) {
          case false:
            states.appendChild(this._cardElements(this._configArray[i], entityName[0] + '_' + entityName[1] + '_' + i, config.entities[i].entity));
            break;
          case true:
            haCard.appendChild(this._cardElements(this._configArray[i], entityName[0] + '_' + entityName[1] + '_' + i, config.entities[i].entity));
            break;
        }
      }
    }

    // Add header if title is defined.
    if (config.title && config.entity_row == false) {
      header.appendChild(name);
      name.textContent = config.title;
      haCard.appendChild(header);
    }

    // Add bars into states element if card is ha-card.
    switch (config.entity_row) {
      case false:
        haCard.appendChild(states);
        break;
    }
    // Add card container to root.
    this.shadowRoot.appendChild(haCard);
    this.shadowRoot.appendChild(haCardStyle);

    // For each entity in entities list update entity.
    if (this._hass) {
      for (let i = 0; i <= config.entities.length - 1; i++) {
        const entityName = config.entities[i].entity.split('.');
        this._updateEntity(config.entities[i].entity, entityName[0] + '_' + entityName[1] + '_' + i, i);
      }
    }

    // Set config for this card.
    this._config = config;
  }

  // Set hass object.
  set hass(hass: any) {
    this._hass = hass;
    const config = this._config;
    for (let i = 0; i <= config.entities.length - 1; i++) {
      const entityName = config.entities[i].entity.split('.');
      this._updateEntity(config.entities[i].entity, entityName[0] + '_' + entityName[1] + '_' + i, i);
    }
  }

  // Create card elements.
  _cardElements(config: config, id: string, entity: any) {
    const card = document.createElement('bar-card-card');
    card.id = 'card_' + id;
    const background = document.createElement('bar-card-background');
    background.id = 'background_' + id;
    const backgroundBar = document.createElement('bar-card-backgroundbar');
    backgroundBar.id = 'bar_' + id;
    const currentBar = document.createElement('bar-card-current');
    currentBar.id = 'currentBar_' + id;
    const contentBar = document.createElement('bar-card-contentbar');
    contentBar.id = 'contentBar_' + id;
    const icon = document.createElement('ha-icon');
    icon.id = 'icon_' + id;
    const iconBar = document.createElement('bar-card-iconbar');
    iconBar.id = 'iconBar_' + id;
    const title = document.createElement('bar-card-title');
    title.id = 'title_' + id;
    const minValue = document.createElement('bar-card-minvalue');
    minValue.id = 'minValue_' + id;
    const divider = document.createElement('bar-card-divider');
    divider.id = 'divider_' + id;
    divider.textContent = `/`;
    const maxValue = document.createElement('bar-card-maxvalue');
    maxValue.id = 'maxValue_' + id;
    const value = document.createElement('bar-card-value');
    value.id = 'value_' + id;
    const animationBar = document.createElement('bar-card-animationbar');
    animationBar.id = 'animationBar_' + id;
    const targetBar = document.createElement('bar-card-targetbar');
    targetBar.id = 'targetBar_' + id;
    const targetMarker = document.createElement('bar-card-targetmarker');
    targetMarker.id = 'targetMarker_' + id;
    const indicator = document.createElement('bar-card-indicator');
    indicator.id = 'indicator_' + id;

    // Add icon to icon bar.
    iconBar.appendChild(icon);

    // Inside elements.
    if (config.positions.icon == 'inside') contentBar.appendChild(iconBar)
    if (config.positions.indicator == 'inside') contentBar.appendChild(indicator);
    if (config.positions.title == 'inside') contentBar.appendChild(title);
    if (config.positions.minmax == 'inside') {
      contentBar.appendChild(minValue);
      contentBar.appendChild(divider);
      contentBar.appendChild(maxValue);
    }
    if (config.positions.value == 'inside') contentBar.appendChild(value);

    // Default elements.
    background.appendChild(backgroundBar);
    background.appendChild(currentBar);
    background.appendChild(animationBar);
    background.appendChild(targetBar);
    background.appendChild(targetMarker);
    background.appendChild(contentBar);

    // Outside elements.
    if (config.positions.icon == 'outside') card.appendChild(iconBar);
    if (config.positions.indicator == 'outside') card.appendChild(indicator);
    if (config.positions.title == 'outside') card.appendChild(title);
    card.appendChild(background);
    if (config.positions.minmax == 'outside') {
      card.appendChild(minValue);
      card.appendChild(divider);
      card.appendChild(maxValue);
    };
    if (config.positions.value == 'outside') card.appendChild(value);
    card.appendChild(this._styleElements(config));
    switch (config.tap_action) {
      case 'info':
        card.addEventListener('click', event => {
          this._showAttributes('hass-more-info', { entityId: entity }, null);
        });
        break;
      case 'service':
        card.addEventListener('click', event => {
          this._serviceCall(config.service_options.domain, config.service_options.service, config.service_options.data);
        });
        break;
    }
    return card;
  }

  // Create style elements.
  _styleElements(config: config) {
    const style = document.createElement('style');

    // Set styles based on config.
    let backgroundWidth;
    let barAlignItems;
    let barCardDirection;
    let barCardMargin;
    let barCardMarginLast;
    let barCardMarginLeft;
    let barDirection;
    let barFlexGrow;
    let contentBarDirection;
    let iconMarginRight;
    let iconMarginTop;
    let indicatorLeft;
    let indicatorMarginLeft;
    let markerDirection;
    let markerStyle;
    let minValueMarginLeft;
    let statesDirection;
    let statesStyle;
    let titleDisplay;
    let titleMargin;
    let valueMargin;

    if (config.width) {
      backgroundWidth = `width: ${config.width};`;
      barFlexGrow = '0';
      barAlignItems = 'center';
    } else {
      backgroundWidth = '';
      barFlexGrow = '1';
      barAlignItems = 'stretch';
    }

    // Stack styles.
    switch (config.stack) {
      case 'horizontal':
        if (config.columns) statesDirection = 'column';
        switch (config.entity_row) {
          case true:
            barCardMargin = 'margin: 0px 8px 0px 0px;';
            break;
          case false:
            barCardMargin = 'margin: 8px 8px 8px 0px;';
            break;
        }
        barCardMarginLast = 'margin-right: 0px;';
        statesStyle = `
        #states > * {
          margin-top: 8px;
        }
        #states {
          display: flex;
          flex-direction: ${statesDirection};
        }
        `
        break;
      case 'vertical':
        barCardMargin = 'margin-bottom: 8px;';
        barCardMarginLast = 'margin-bottom: 0px;';
        statesStyle = `
        #states > * {
            margin: 8px 0px;
          }
        `
    }

    // Min Max styles.
    switch (config.positions.minmax) {
      case 'off':
        valueMargin = 'margin-left: auto;';
        break;
      default:
        valueMargin = 'margin-left: 8px;';
    }

    // Indicator styles.
    switch (config.positions.indicator) {
      case 'outside':
        indicatorLeft = '-3px';
        indicatorMarginLeft = '-16px';
        break;
      case  'inside':
        indicatorMarginLeft = '-16px';
        indicatorLeft = '0px';
        break;
    }

    // Bar Card styles.
    switch (config.direction) {
      case 'up':
      case 'down':
        barCardMarginLeft = '0px';
        iconMarginRight = '0px';
        iconMarginTop = '-8px';
        indicatorLeft = '0px';
        indicatorMarginLeft = '0px';
        minValueMarginLeft = '0px';
        titleDisplay = '';
        break;
      case 'left':
      case 'right':
        titleDisplay = 'display: flex;';
        switch (config.positions.minmax) {
          case 'outside':
            minValueMarginLeft = '4px';
            break;
          case 'inside':
            minValueMarginLeft = 'auto';
            break;
        }
        iconMarginTop = '0px';
        iconMarginRight = '12px';
        barCardMarginLeft = 'auto';
        break;
    }

    // Set element directions based on config.
    switch (config.direction) {
      case 'left':
      case 'left-reverse':
        barDirection = 'left';
        markerDirection = 'right';
        break;
      case 'right':
      case 'right-reverse':
        barDirection = 'right';
        markerDirection = 'left';
        break;
      case 'up':
      case 'up-reverse':
        barDirection = 'top';
        markerDirection = 'bottom';
        break;
      case 'down':
      case 'down-reverse':
        barDirection = 'bottom';
        markerDirection = 'top';
        break;
    }

    // Target marker styles.
    switch (barDirection) {
      case 'left':
      case 'right':
        markerStyle = `
          ${markerDirection}: var(--targetMarker-percent);
          height: 100%;
          border-left: 2px solid var(--bar-color);
        `;
        break;
      case 'top':
      case 'bottom':
        markerStyle = `
          ${markerDirection}: var(--targetMarker-percent);
          width: 100%;
          border-top: 2px solid var(--bar-color);
        `;
        break;
    }

    // Direction styles.
    switch (config.direction) {
      case 'up':
      case 'down':
        valueMargin = 'margin-bottom: 4px;';
        contentBarDirection = 'column';
        titleMargin = 'margin-bottom: auto;';
        barCardDirection = 'column-reverse';
        break;
      case 'left':
      case 'right':
        titleMargin = 'margin-left: 4px;';
        contentBarDirection = 'row';
        barCardDirection = 'row';
    }

    // Set CSS styles
    style.textContent = `
      ${statesStyle}
      bar-card-card {
        ${barCardMargin}
        align-items: ${barAlignItems};
        display: flex;
        flex-basis: 100%;
        flex-direction: ${barCardDirection};
      }
      bar-card-card:last-child{
        ${barCardMarginLast}
      }
      bar-card-background {
        ${backgroundWidth}
        cursor: pointer;
        flex-grow: ${barFlexGrow};
        height: ${config.height};
        margin-left: ${barCardMarginLeft};
        position: relative;
      }
      bar-card-current, bar-card-contentbar, bar-card-backgroundbar, bar-card-targetbar, bar-card-animationbar {
        position: absolute;
        height: 100%;
        width: 100%;
        border-radius: var(--bar-card-border-radius, var(--ha-card-border-radius));
      }
      bar-card-contentbar {
        align-items: center;
        color: var(--primary-text-color);
        display: flex;
        flex-direction: ${contentBarDirection};
        justify-content: flex-start;
      }
      bar-card-backgroundbar {
        background: var(--bar-color);
        filter: brightness(0.5);
        opacity: 0.25;
      }
      bar-card-current {
        background: linear-gradient(to ${barDirection}, var(--bar-color) var(--bar-percent), #0000 var(--bar-percent), #0000 var(--bar-percent));
      }
      bar-card-animationbar {
        background: linear-gradient(to ${barDirection}, #FFF0 var(--bar-percent), var(--bar-color) var(--bar-percent), var(--bar-color) var(--bar-charge-percent), #FFF0 var(--bar-charge-percent));
        filter: var(--bar-charge-brightness);
        opacity: var(--bar-charge-opacity);
      }
      bar-card-targetbar {
        background: linear-gradient(to ${barDirection}, #FFF0 var(--targetBar-left-percent), var(--bar-color) var(--targetBar-left-percent), var(--bar-color) var(--targetBar-right-percent), #FFF0 var(--targetBar-right-percent));
        display: var(--target-display);
        filter: brightness(0.66);
        opacity: 0.33;
      }
      bar-card-targetmarker {
        ${markerStyle}
        background: #FFF0;
        display: var(--target-display);
        filter: brightness(0.75);
        opacity: 50%;
        position: absolute;
      }
      bar-card-iconbar {
        color: var(--icon-color, var(--paper-item-icon-color));
        align-items: center;
        align-self: center;
        display: flex;
        height: 40px;
        justify-content: center;
        margin-right: ${iconMarginRight};
        margin-top: ${iconMarginTop};
        position: relative;
        width: 40px;
      }
      bar-card-value {
        margin: 4px;
        white-space: nowrap;
        ${valueMargin}
      }
      bar-card-value, bar-card-minvalue, bar-card-maxvalue, bar-card-divider {
        align-self: center;
        position: relative;
      }
      bar-card-minvalue, bar-card-maxvalue, bar-card-divider {
        font-size: 10px;
        margin: 2px;
        opacity: 0.5;
      }
      bar-card-divider {
        margin-left: 0px;
        margin-right: 0px;
      }
      bar-card-minvalue {
        margin-left: ${minValueMarginLeft};
      }
      bar-card-title {
        align-items: center;
        align-self: stretch;
        justify-content: center;
        margin: 4px;
        overflow: hidden;
        position: relative;
        text-align: center;
        text-overflow: ellipsis;
        ${titleDisplay}
        ${titleMargin}
      }
      bar-card-indicator {
        align-self: center;
        color: var(--bar-color);
        filter: brightness(0.75);
        height: 16px;
        left: ${indicatorLeft};
        margin-left: ${indicatorMarginLeft};
        position: relative;
        text-align: center;
        width: 16px;
      }
    `;
    return style;
  }

  // Map range function
  _mapRange(num: number, in_min: number, in_max: number, out_min: number, out_max: number) {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }

  _computeBarColor(config: any, entityState: string) {
    let barColor;
    if (config.severity) barColor = this._computeSeverity(entityState, config.severity, config);
    else barColor = config.color;
    return barColor;
  }

  // Translates entity percentage to bar percentage
  _computePercent(value: number, min: number, max: number, index: number, entity: string) {
    const config = this._configAttributeCheck(entity, index);

    switch (config.direction) {
      case 'right-reverse':
      case 'left-reverse':
      case 'up-reverse':
      case 'down-reverse':
        return 100 - (100 * (value - min)) / (max - min);
      default:
        return (100 * (value - min)) / (max - min);
    }
  }

  // Returns color based on severity array
  _computeSeverity(stateValue: any, sections: any[], config: any) {
    const numberValue = Number(stateValue);
    let color: undefined | string;

    sections.forEach(section => {
      if (isNaN(section.value)) {
        if (section.value == stateValue && color == undefined) {
          color = section.color;
        }
      }
      if (numberValue >= section.from && numberValue <= section.to) {
        color = section.color;
      }
    });

    if (color == undefined) color = config.color;
    return color;
  }

  // Returns icon based on severity array
  _computeSeverityIcon(stateValue: any, sections: any[]) {
    let numberValue = Number(stateValue);
    let icon: undefined | string;
    sections.forEach(section => {
      if (isNaN(section.value)) {
        if (section.value == stateValue && icon == undefined) {
          icon = section.icon;
        }
      }
      if (numberValue >= section.from && numberValue <= section.to) {
        icon = section.icon;
      }
    });
    return icon;
  }

  // Check if min is defined otherwise check for min attribute
  _minCheck(entity: string, hass: any, index: number) {
    const config = this._configAttributeCheck(entity, index);
    if (hass.states[entity].attributes.min && config.entity_config == true) return hass.states[entity].attributes.min;
    else return config.min;
  }

  // Check if max is defined otherwise check for max attribute
  _maxCheck(entity: string, hass: any, index: number) {
    const config = this._configAttributeCheck(entity, index);
    if (hass.states[entity].attributes.max && config.entity_config == true) return hass.states[entity].attributes.max;
    else return config.max;
  }

  _serviceCall(domain: string, service: string, data: any) {
    const hass = this._hass;
    hass.callService(domain, service, data);
  }

  // Press action
  _showAttributes(type: string, detail: any, options: any) {
    const root: any = this.shadowRoot;
    options = options || {};
    detail = detail === null || detail === undefined ? {} : detail;
    const event: any = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    root.dispatchEvent(event);
    return event;
  }

  // Check entity attribute overrides
  _configAttributeCheck(entity: string, index: number) {
    const hass = this._hass;
    const config = Object.assign({}, this._configArray[index]);
    const entityAttributes = hass.states[entity].attributes;
    if (config.entity_config == true) {
      Object.keys(config).forEach(section => {
          if (entityAttributes[section]) {
            if (section == 'severity' && typeof entityAttributes[section] == 'string') config[section] = JSON.parse(entityAttributes[section]);
            else config[section] = entityAttributes[section];
          }
      });
    }
    return config;
  }

  // Update bar percentages.
  _updateBar(entityState: any, hass: any, id: string, entity: string, index: number) {
    const minValue = this._minCheck(entity, hass, index)
    const maxValue = this._maxCheck(entity, hass, index);
    const barElement: any = this.shadowRoot.getElementById('currentBar_' + id);

    if (!isNaN(entityState)) {
      barElement.style.setProperty('--bar-percent', `${this._computePercent(entityState, minValue, maxValue, index, entity)}%`);
      barElement.style.setProperty('--bar-charge-percent', `${this._computePercent(entityState, minValue, maxValue, index, entity)}%`);
    } else {
      barElement.style.setProperty('--bar-percent', `0%`);
      barElement.style.setProperty('--bar-charge-percent', `0%`);
    }
  }

  // Update animation.
  _updateAnimation(entityState: any, configDuration: number, configStop: boolean, id: string, entity: string, index: number) {
    const config = this._configAttributeCheck(entity, index);
    const root = this.shadowRoot;
    const hass = this._hass;
    const element = root.getElementById('animationBar_' + id);
    const minValue = this._minCheck(entity, hass, index);
    const maxValue = this._maxCheck(entity, hass, index);
    let configDirection = this._animationDirection[id];
    let currentPercent = this._computePercent(entityState, minValue, maxValue, index, entity);
    let totalFrames = currentPercent * 3 + config.animation.delay / (config.animation.speed / 250) / 3;
    let scaledPercent = currentPercent * 3;

    if (configStop == true) configDuration = 0;

    let options = {
      iterations: Infinity,
      iterationStart: 0,
      delay: 0,
      endDelay: 0,
      direction: 'normal',
      duration: configDuration,
      fill: 'both'
    };

    // Reverse animation
    switch (config.direction) {
      case 'left-reverse':
      case 'right-reverse':
      case 'up-reverse':
      case 'down-reverse':
        if (configDirection == 'normal') configDirection = 'reverse';
        else configDirection = 'normal';
    }
    let keyframes = [];
    let i = scaledPercent;
    if (configDirection == 'normal') {
      for (; i <= totalFrames; ) {
        let opacity = this._mapRange(i / 3, currentPercent, currentPercent + 25, 0.5, 0);
        let keyframe = { '--bar-charge-percent': i / 3 + '%', '--bar-percent': currentPercent + '%', '--bar-charge-opacity': opacity };
        keyframes.push(keyframe);
        i++;
      }
      element.style.setProperty('--bar-charge-brightness', 'brightness(1)');
    }
    if (configDirection == 'reverse') {
      for (; i <= totalFrames; ) {
        const reversePercent = currentPercent - (i - scaledPercent) / 3;
        let opacity = this._mapRange(i / 3, currentPercent, currentPercent + 25, 0.5, 0);
        let keyframe = { '--bar-charge-percent': currentPercent + '%', '--bar-percent': reversePercent + '%', '--bar-charge-opacity': opacity };
        keyframes.push(keyframe);
        i++;
      }
      element.style.setProperty('--bar-charge-brightness', 'brightness(0.25)');
    }
    const animation = element.animate(keyframes, options);
    animation.id = id;
    return animation;
  }

  // Sets position and direction of the indicator
  _updateIndicator(direction: string, id: string, color: string) {
    const root: any = this.shadowRoot;
    const indicatorElement = root.getElementById('indicator_' + id);
    indicatorElement.style.setProperty('--bar-color', color);

    switch (direction) {
      case 'up':
        indicatorElement.textContent = '▲';
        break;
      case 'down':
        indicatorElement.textContent = '▼';
        break;
      case 'off':
        indicatorElement.textContent = '';
        break;
    }
  }

  // Scale the target bar size.
  _updateTargetBar(entityState: any, target: number, color: string, id: string, entity: string, index: number) {
    const config = this._configAttributeCheck(entity, index);
    const root: any = this.shadowRoot;
    const targetBarElement = root.getElementById('targetBar_' + id);
    const targetMarkerElement = root.getElementById('targetMarker_' + id);
    if (config.target) {
      const hass = this._hass;
      const minValue = this._minCheck(entity, hass, index);
      const maxValue = this._maxCheck(entity, hass, index);
      const currentPercent = this._computePercent(entityState, minValue, maxValue, index, entity);
      const targetPercent = this._computePercent(target, minValue, maxValue, index, entity);
      let initialPercent;
      let diffPercent;
      if (currentPercent > targetPercent) {
        initialPercent = targetPercent;
        diffPercent = currentPercent;
      } else {
        initialPercent = currentPercent;
        diffPercent = targetPercent;
      }
      targetBarElement.style.setProperty('--targetBar-left-percent', initialPercent + '%');
      targetBarElement.style.setProperty('--targetBar-right-percent', diffPercent + '%');
      targetBarElement.style.setProperty('--bar-color', color);
      targetMarkerElement.style.setProperty('--targetMarker-percent', targetPercent + '%');
      targetMarkerElement.style.setProperty('--bar-color', color);
    } else {
      targetBarElement.style.setProperty('--target-display', 'none');
      targetMarkerElement.style.setProperty('--target-display', 'none');
    }
  }

  // On entity update.
  _updateEntity(entity: string, id: string, index: number) {
    const hass = this._hass;
    const entityObject = hass.states[entity];
    const root: any = this.shadowRoot;

    // Check if entity exists
    if (entityObject == undefined) {
      const container = root.getElementById('card_' + id);
      while (container.lastChild) container.removeChild(container.lastChild);
      const warning = document.createElement('hui-warning');
      warning.setAttribute("style", "width: 100%;");
      warning.textContent = `Entity not available: ${entity}`;
      root.getElementById('card_' + id).appendChild(warning);
      return;
    }

    // Define config
    const config = this._configAttributeCheck(entity, index);

    // Define title
    if (!config.name) config.name = entityObject.attributes.friendly_name;

    // Check for title position config
    if (config.positions.title != 'off') root.getElementById('title_' + id).textContent = config.name;

    // Define entity state if not defined.
    if (!this._entityState) this._entityState = [];

    // Define target variable.
    let configTarget;
    if (config.target) configTarget = config.target;

    // Define min max variables.
    const configMin = this._minCheck(entity, hass, index);
    const configMax = this._maxCheck(entity, hass, index);

    // Define Entity State
    let entityState;
    if (config.attribute) {
      entityState = entityObject.attributes[config.attribute];
    } else {
      entityState = entityObject.state;
    }

    if (!isNaN(entityState)) {
      entityState = Number(entityState);
    }

    if (config.limit_value) {
      entityState = Math.min(entityState, configMax);
      entityState = Math.max(entityState, configMin);
    }

    // Define Icon.
    if (config.positions.icon != 'off') {
      if (!config.icon) {
        root.getElementById('icon_' + id).icon = entityObject.attributes.icon;
      } else {
        if (!config.severity || this._computeSeverityIcon(entityState, config.severity) == undefined) {
          root.getElementById('icon_' + id).icon = config.icon;
        } else {
          root.getElementById('icon_' + id).icon = this._computeSeverityIcon(entityState, config.severity);
        }
      }
    }

    // Set measurement
    let measurement;
    if (config.unit_of_measurement) measurement = config.unit_of_measurement;
    else measurement = entityObject.attributes.unit_of_measurement || '';

    // Define target, min and max if not defined
    if (!this._entityTarget) this._entityTarget = {};
    if (!this._currentMin) this._currentMin = {};
    if (!this._currentMax) this._currentMax = {};

    // Defined elements
    const barElement = root.getElementById('currentBar_' + id);

    // Define global currentAnimation
    if (!this._currentAnimation) this._currentAnimation = {};
    if (!this._animationDirection) this._animationDirection = {};

    // Define bar color.
    let barColor = this._computeBarColor(config, entityState);

    // Adjust state and measurement when value is unavailable.
    if (entityObject.state == 'unavailable') {
      entityState = 'Unavailable';
      measurement = '';
      if (config.positions.icon !== 'off') root.getElementById('iconBar_' + id).style.setProperty('--icon-color', 'var(--disabled-text-color)');
      barColor = `var(--bar-card-disabled-color, ${this._computeBarColor(config, entityState)})`;
    } else {
      if (config.positions.icon !== 'off') root.getElementById('iconBar_' + id).style.removeProperty('--icon-color');
    }

    // Adjust decimal value.
    if (!isNaN(entityState)) {
      if (config.decimal == 0) entityState = entityState.toFixed(0);
      else if (config.decimal) entityState = entityState.toFixed(config.decimal);
    }

    // On entity update
    if (entityState !== this._entityState[id]) {

      // Update bar percentage.
      this._updateBar(entityState, hass, id, entity, index);

      // Update target bar.
      this._updateTargetBar(entityState, configTarget, barColor, id, entity, index);
      this._entityTarget[id] = configTarget;

      // Update bar color.
      barElement.style.setProperty('--bar-color', barColor);

      // Update min max.
      if (config.positions.minmax != 'off') {
        root.getElementById('minValue_' + id).textContent = `${configMin}${measurement}`;
        root.getElementById('maxValue_' + id).textContent = `${configMax}${measurement}`;
      }

      // Update value.
      if (config.positions.value !== 'off') root.getElementById('value_' + id).textContent = `${entityState} ${measurement}`;

      // Update bar.
      root.getElementById('bar_' + id).style.setProperty('--bar-color', barColor);

      // Update indicator.
      if (config.positions.indicator !== 'off') {
        if (entityState > this._entityState[id]) this._updateIndicator('up', id, barColor);
        if (entityState < this._entityState[id]) this._updateIndicator('down', id, barColor);
        if (entityState == configMax) {
          this._updateIndicator('off', id, barColor);
          if (this._currentAnimation[id]) this._currentAnimation[id].pause();
        }
        if (entityState == configMin) {
          this._updateIndicator('off', id, barColor);
          if (this._currentAnimation[id]) this._currentAnimation[id].pause();
        }
      }


      // Update animation bar.
      if (config.animation.state == 'on') {
        root.getElementById('animationBar_' + id).style.setProperty('--bar-color', barColor);
        if (entityState > this._entityState[id]) {
          this._animationDirection[id] = 'normal';
          if (this._currentAnimation[id]) this._currentAnimation[id].pause();
          this._currentAnimation[id] = this._updateAnimation(entityState, config.animation.delay, false, id, entity, index);
        }
        if (entityState < this._entityState[id]) {
          this._animationDirection[id] = 'reverse';
          if (this._currentAnimation[id]) this._currentAnimation[id].pause();
          this._currentAnimation[id] = this._updateAnimation(entityState, config.animation.delay, false, id, entity, index);
        }
      }
    }

    // On target update.
    if (config.target) {
      if (configTarget != this._entityTarget[id]) {
        this._updateTargetBar(entityState, configTarget, barColor, id, entity, index);
        this._entityTarget[id] = configTarget;
        if (this._currentAnimation[id] && config.animation.state !== 'off') this._currentAnimation[id] = this._updateAnimation(entityState, config.animation.delay, false, id, entity, index);
      }
    }

    // On min update.
    if (configMin !== this._currentMin[id]) {
      this._updateBar(entityState, hass, id, entity, index);
      this._currentMin[id] = configMin;
      if (config.target) {
        this._updateTargetBar(entityState, configTarget, barColor, id, entity, index);
        this._currentMin[id] = configMin;
      }
      if (this._currentAnimation[id] && config.animation.state == 'on') this._currentAnimation[id] = this._updateAnimation(entityState, config.animation.delay, false, id, entity, index);
    }

    // On max update.
    if (configMax !== this._currentMax[id]) {
      this._updateBar(entityState, hass, id, entity, index);
      this._currentMax[id] = configMax;
      if (config.target) {
        this._updateTargetBar(entityState, configTarget, barColor, id, entity, index);
        this._currentMax[id] = configMax;
      }
      if (this._currentAnimation[id] && config.animation.state == 'on') this._currentAnimation[id] = this._updateAnimation(entityState, config.animation.delay, false, id, entity, index);
    }
    this._entityState[id] = entityState;
  }

  getCardSize() {
    if (this._config.entity_row == true) return 1;
    else return 2;
  }
}

customElements.define('bar-card', BarCard);
