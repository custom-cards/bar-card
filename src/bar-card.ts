console.info(`%cBAR-CARD\n%cVersion: 2.0.2`, 'color: green; font-weight: bold;', '');

export interface config {
  align: string;
  animation: string;
  attribute: any;
  charge_entity: any;
  color: string;
  columns: number;
  decimal: any;
  delay: number;
  direction: string;
  entity: string;
  entities: any;
  height: string;
  icon: any;
  icon_position: string;
  indicator: string;
  limit_value: boolean;
  max: number;
  min: number;
  padding: string;
  rounding: string;
  saturation: string;
  service_options: { domain: string; service: string; data: any };
  severity: any;
  show_minmax: boolean;
  show_value: boolean;
  speed: number;
  tap_action: string;
  target: any;
  title: string;
  title_position: string;
  unit_of_measurement: string;
  visibility: string;
  width: string;
}

class BarCard extends HTMLElement {
  shadowRoot: any;
  _configArray!: any[];
  _initialConfigArray!: any[];
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
  setConfig(config: config) {
    while (this.shadowRoot.lastChild) this.shadowRoot.removeChild(this.shadowRoot.lastChild);

    // Deep copy function.
    function deepcopy(value: any): any {
      if (!(!!value && typeof value == 'object')) {
        return value;
      }
      if (Object.prototype.toString.call(value) == '[object Date]') {
        return new Date(value.getTime());
      }
      if (Array.isArray(value)) {
        return value.map(deepcopy);
      }
      var result: any = {};
      Object.keys(value).forEach(
        function(key) { result[key] = deepcopy(value[key]); });
      return result;
    }

    // Avoid card config modifying lovelace config.
    const initialConfig = deepcopy(config);

    // Default Card variables
    const defaultConfig = {
      align: 'center',
      animation: 'auto',
      attribute: false,
      charge_entity: false,
      color: 'var(--custom-bar-card-color, var(--primary-color))',
      decimal: false,
      delay: 5000,
      direction: 'right',
      height: '40px',
      icon: false,
      icon_position: 'off',
      indicator: 'auto',
      limit_value: false,
      max: 100,
      min: 0,
      saturation: '50%',
      severity: false,
      show_minmax: false,
      show_value: true,
      speed: 1000,
      tap_action: 'info',
      target: false,
      title: false,
      title_position: 'left',
      unit_of_measurement: false,
      visibility: false
    };

    // Merge default and card config.
    config = Object.assign(defaultConfig, config);

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

    if (config.severity) {
      // Clone array
      let newArray = config.severity.slice();

      // Sort array by seconds.
      newArray.sort(function(a: any,b: any) {
          return a.value - b.value;
      });

      config.severity = newArray;
    }

    // Check if title position is inside
    if (!config.width) {
      switch (config.title_position) {
        case 'inside':
        case 'top':
        case 'bottom':
        case 'off':
          config.width = '100%';
          break;
        case 'left':
        case 'right':
          config.width = '70%';
      }
      switch (config.icon_position) {
        case 'top':
        case 'bottom':
          config.width = '100%';
          break;
        case 'left':
        case 'right':
          config.width = 'calc(100% - 50px)';
          break;
        case 'inside':
        case 'off':
          switch (config.title_position) {
            case 'inside':
            case 'top':
            case 'bottom':
            case 'off':
              config.width = '100%';
              break;
            case 'left':
            case 'right':
              config.width = '70%';
          }
      }
    }

    // Define card container
    const haCard = document.createElement('ha-card');
    const cardContainer = document.createElement('card');
    const cardContainerStyle = document.createElement('style');
    cardContainerStyle.textContent = `
      card {
        display: flex;
        justify-content: space-around;
        flex-wrap: wrap;
      }
    `;

    // For each entity in entities list create cardElements
    this._configArray = [];
    this._initialConfigArray = [];
    for (let i = 0; i <= config.entities.length - 1; i++) {
      const entityName = config.entities[i].entity.split('.');
      this._configArray[i] = Object.assign({}, config);
      this._initialConfigArray[i] = Object.assign({}, initialConfig);
      Object.keys(config).forEach(section => {
        const config = this._configArray[i];
        const entities = config.entities[i];
        const initialConfig = this._initialConfigArray[i];
        if (entities[section] !== undefined) {
          config[section] = entities[section];
          initialConfig[section] = entities[section];
        }
      });
      cardContainer.appendChild(this._cardElements(this._configArray[i], entityName[0] + '_' + entityName[1] + '_' + i, config.entities[i].entity));
    }

    // Add card container to root
    haCard.appendChild(cardContainer);
    this.shadowRoot.appendChild(haCard);
    this.shadowRoot.appendChild(cardContainerStyle);

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

  // Create card elements
  _cardElements(config: config, id: string, entity: any) {
    const card = document.createElement('bar-card-card');
    card.id = 'card_' + id;
    const container = document.createElement('bar-card-container');
    container.id = 'container_' + id;
    const background = document.createElement('bar-card-background');
    background.id = 'background_' + id;
    const backgroundBar = document.createElement('bar-card-backgroundbar');
    backgroundBar.id = 'backgroundBar_' + id;
    const bar = document.createElement('bar-card-bar');
    bar.id = 'bar_' + id;
    const contentBar = document.createElement('bar-card-contentbar');
    contentBar.id = 'contentBar_' + id;
    const icon = document.createElement('ha-icon');
    icon.id = 'icon_' + id;
    const title = document.createElement('bar-card-title');
    title.id = 'title_' + id;
    const titleBar = document.createElement('bar-card-titlebar');
    titleBar.id = 'titleBar_' + id;
    const valueContainer = document.createElement('bar-card-valuecontainer');
    valueContainer.id = 'value_container_' + id;
    const minValue = document.createElement('bar-card-minvalue');
    minValue.id = 'min_value_' + id;
    const value = document.createElement('bar-card-value');
    value.id = 'value_' + id;
    const maxValue = document.createElement('bar-card-maxvalue');
    maxValue.id = 'max_value_' + id;
    const chargeBar = document.createElement('bar-card-chargeBar');
    chargeBar.id = 'chargeBar_' + id;
    const targetBar = document.createElement('bar-card-targetBar');
    targetBar.id = 'targetBar_' + id;
    const targetMarker = document.createElement('bar-card-targetmarker');
    targetMarker.id = 'targetMarker_' + id;
    const indicatorContainer = document.createElement('bar-card-indicatorcontainer');
    indicatorContainer.id = 'indicatorContainer_' + id;
    const indicatorBar = document.createElement('bar-card-indicatorbar');
    indicatorBar.id = 'indicatorBar_' + id;
    const indicator = document.createElement('bar-card-indicator');
    indicator.id = 'indicator_' + id;

    // Start building card
    background.appendChild(backgroundBar);
    background.appendChild(bar);
    bar.appendChild(targetMarker);
    background.appendChild(targetBar);
    background.appendChild(chargeBar);
    indicatorContainer.appendChild(indicator);
    switch (config.align) {
      case 'center':
      case 'center-split':
      case 'left-split':
      case 'right-split':
        indicatorBar.appendChild(indicatorContainer);
        background.appendChild(indicatorBar);
        break;
      default:
        background.appendChild(indicatorContainer);
    }
    switch (config.icon_position) {
      case 'inside':
      case 'off':
        contentBar.appendChild(icon);
        break;
      case 'left':
      case 'right':
      case 'top':
      case 'bottom':
        titleBar.appendChild(icon);
        container.appendChild(titleBar);
    }
    switch (config.title_position) {
      case 'left':
      case 'right':
      case 'top':
      case 'bottom':
        titleBar.appendChild(title);
        container.appendChild(titleBar);
        container.appendChild(background);
        break;
      case 'inside':
        contentBar.appendChild(title);
        container.appendChild(contentBar);
        container.appendChild(background);
        break;
      case 'off':
        container.appendChild(background);
    }
    contentBar.appendChild(valueContainer);
    if (config.show_minmax == true) valueContainer.appendChild(minValue);
    valueContainer.appendChild(value);
    if (config.show_minmax == true) valueContainer.appendChild(maxValue);
    background.appendChild(contentBar);
    card.appendChild(container);
    card.appendChild(this._styleElements(config, id));
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

  // Create style elements
  _styleElements(config: config, id: string) {
    const style = document.createElement('style');

    // Set titleBar position
    let titleAlign;
    let titleWidth;
    let titleflexDirection;
    switch (config.title_position) {
      case 'left':
        titleWidth = 'width: calc(100% - ' + config.width + ');';
        titleAlign = 'justify-content: flex-start;';
        titleflexDirection = 'flex-direction: row;';
        break;
      case 'right':
        titleWidth = 'width: calc(100% - ' + config.width + ');';
        titleAlign = 'justify-content: flex-start;';
        titleflexDirection = 'flex-direction: row-reverse;';
        break;
      case 'top':
        titleWidth = 'width: 100%;';
        titleAlign = 'justify-content: center;';
        titleflexDirection = 'flex-direction: column;';
        break;
      case 'bottom':
        titleWidth = 'width: 100%;';
        titleAlign = 'justify-content: center;';
        titleflexDirection = 'flex-direction: column-reverse;';
        break;
    }

    // Set icon position
    switch (config.icon_position) {
      case 'left':
        titleWidth = 'width: calc(100% - ' + config.width + ');';
        if (config.title_position == 'off' || config.title_position == 'inside') titleAlign = 'justify-content: center;';
        else titleAlign = 'justify-content: flex-start;';
        titleflexDirection = 'flex-direction: row;';
        break;
      case 'right':
        titleWidth = 'width: calc(100% - ' + config.width + ');';
        if (config.title_position == 'off' || config.title_position == 'inside') titleAlign = 'justify-content: center;';
        else titleAlign = 'justify-content: flex-start;';
        titleflexDirection = 'flex-direction: row-reverse;';
        break;
      case 'top':
        titleWidth = 'width: 100%;';
        titleAlign = 'justify-content: center;';
        titleflexDirection = 'flex-direction: column;';
        break;
      case 'bottom':
        titleWidth = 'width: 100%;';
        titleAlign = 'justify-content: center;';
        titleflexDirection = 'flex-direction: column-reverse;';
        break;
    }

    // Set value flex direction based on card direction
    let valueflexDirection;

    switch (config.direction) {
      case 'left':
      case 'left-reverse':
        valueflexDirection = 'flex-direction: row-reverse;';
        break;
      case 'right':
      case 'right-reverse':
        valueflexDirection = 'flex-direction: row;';
        break;
      case 'up':
      case 'up-reverse':
        valueflexDirection = 'flex-direction: column-reverse;';
        break;
      case 'down':
      case 'down-reverse':
        valueflexDirection = 'flex-direction: column;';
        break;
    }

    // Set marker direction based on card direction
    let markerDirection;
    let barFrom;
    let insideWhitespace;

    switch (config.direction) {
      case 'left':
      case 'left-reverse':
        barFrom = 'left';
        markerDirection = 'right';
        insideWhitespace = 'nowrap';
        break;
      case 'right':
      case 'right-reverse':
        barFrom = 'right';
        markerDirection = 'left';
        insideWhitespace = 'nowrap';
        break;
      case 'up':
      case 'up-reverse':
        barFrom = 'top';
        markerDirection = 'bottom';
        break;
      case 'down':
      case 'down-reverse':
        barFrom = 'bottom';
        markerDirection = 'top';
        break;
    }

    // Set marker style based on bar direction
    let markerStyle;

    if (barFrom == 'left' || barFrom == 'right') {
      markerStyle = `
        ${markerDirection}: var(--targetMarker-percent);
        height: ${config.height};
        border-left: 2px dashed var(--bar-color);
      `;
    } else {
      markerStyle = `
        ${markerDirection}: var(--targetMarker-percent);
        width: 100%;
        border-top: 2px dashed var(--bar-color);
      `;
    }

    // Set title style based on title position
    let titlePositionStyle;

    if (config.title_position == 'inside') {
      titlePositionStyle = `
      width: calc(100% - 8px);
      font-weight: bold;
      color: #FFF;
      text-shadow: 1px 1px #0007;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: ${insideWhitespace};
      `;
    } else {
      titlePositionStyle = `
      color: var(--primary-text-color);
      padding-left: 10px;
      padding-right: 10px;
      padding-top: 4px;
      padding-bottom: 4px;
      text-overflow: ellipsis;
      overflow: hidden;
      `;
    }

    let iconMarginStyle = '';

    if (config.icon_position !== 'inside' && config.title_position !== 'off' && config.title_position !== 'inside') {
      iconMarginStyle = `
      margin-left: 8px;
      `;
    }

    let justifyContent;
    let alignItems;
    let textAlign;
    let flexDirection;

    switch (config.align) {
      case 'right':
        flexDirection = 'column';
        textAlign = 'right';
        alignItems = 'flex-end';
        justifyContent = 'center';
        break;
      case 'left':
        flexDirection = 'column';
        justifyContent = 'center';
        alignItems = 'flex-start';
        textAlign = 'left';
        break;
      case 'top':
        flexDirection = 'column';
        justifyContent = 'flex-start';
        alignItems = 'center';
        textAlign = 'center';
        break;
      case 'top-split':
        flexDirection = 'row';
        justifyContent = 'space-between';
        alignItems = 'flex-start';
        if (config.icon_position != 'off') textAlign = 'center';
        if (config.icon_position == 'inside') textAlign = 'center';
        else textAlign = 'left';
        break;
      case 'bottom':
        flexDirection = 'column';
        justifyContent = 'flex-end';
        alignItems = 'center';
        textAlign = 'center';
        break;
      case 'bottom-split':
        flexDirection = 'row';
        justifyContent = 'space-between';
        alignItems = 'flex-end';
        if (config.icon_position != 'off') textAlign = 'center';
        if (config.icon_position == 'inside') textAlign = 'center';
        else textAlign = 'left';
        break;
      case 'split':
        alignItems = 'center';
        flexDirection = 'row';
        justifyContent = 'space-between';
        if (config.icon_position != 'off') textAlign = 'center';
        if (config.icon_position == 'inside') textAlign = 'center';
        else textAlign = 'left';
        break;
      case 'left-split':
        flexDirection = 'column';
        justifyContent = 'space-between';
        alignItems = 'flex-start';
        break;
      case 'right-split':
        flexDirection = 'column';
        justifyContent = 'space-between';
        alignItems = 'flex-end';
        textAlign = 'right';
        break;
      case 'center':
        flexDirection = 'column';
        textAlign = 'center';
        justifyContent = 'center';
        alignItems = 'center';
        break;
      case 'center-split':
        flexDirection = 'column';
        textAlign = 'center';
        justifyContent = 'space-between';
        alignItems = 'center';
    }
    if (config.title_position != 'inside') textAlign = 'left';

    // Set CSS styles
    let haCardWidth;

    if (config.columns) haCardWidth = Math.trunc(100 / Number(config.columns));
    else haCardWidth = 100;


    style.textContent = `
      bar-card-card {
        width: ${haCardWidth}%;
        --card-display: visible;
        display: var(--card-display);
        margin-bottom: 8px;
      }
      bar-card-card:last-child{
        margin-bottom: 0px;
      }
      bar-card-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        ${titleflexDirection}
      }
      bar-card-background {
        cursor: pointer;
        position: relative;
        display: flex;
        flex-direction: var(--flex-direction);
        width: ${config.width};
        height: ${config.height};
      }
      bar-card-contentbar {
        position: relative;
        display: flex;
        flex-direction: ${flexDirection};
        align-items: ${alignItems};
        justify-content: ${justifyContent};
        --padding: 4px;
        height: calc(${config.height} - (var(--padding)*2));
        width: calc(100% - (var(--padding)*2));
        padding: var(--padding);
      }
      bar-card-bar, bar-card-backgroundbar, bar-card-targetbar, bar-card-valuebar, bar-card-chargebar, bar-card-chargebarcolor, bar-card-valuebar, bar-card-indicatorbar {
        position: absolute;
        height: 100%;
        width: 100%;
        border-radius: var(--bar-card-border-radius, var(--ha-card-border-radius));
      }
      bar-card-backgroundbar {
        background: var(--bar-color);
        filter: brightness(0.5);
        opacity: 0.25;
      }
      bar-card-bar {
        background: linear-gradient(to ${barFrom}, var(--bar-color) var(--bar-percent), #0000 var(--bar-percent), #0000 var(--bar-percent));
      }
      bar-card-chargebar {
        background: linear-gradient(to ${barFrom}, #FFF0 var(--bar-percent), var(--bar-color) var(--bar-percent), var(--bar-color) var(--bar-charge-percent), #FFF0 var(--bar-charge-percent));
        filter: var(--bar-charge-brightness);
        opacity: var(--bar-charge-opacity);
      }
      bar-card-targetbar {
        display: var(--target-display);
        filter: brightness(0.66);
        opacity: 0.33;
        background: linear-gradient(to ${barFrom}, #FFF0 var(--targetBar-left-percent), var(--bar-color) var(--targetBar-left-percent), var(--bar-color) var(--targetBar-right-percent), #FFF0 var(--targetBar-right-percent));
      }
      bar-card-targetmarker {
        display: var(--target-display);
        position: absolute;
        background: #FFF0;
        ${markerStyle}
        filter: brightness(0.75);
      }
      ha-icon {
        display: var(--icon-display);
        position: relative;
        font-weight: bold;
        color: #FFF;
        filter: drop-shadow(1px 1px #0005);
        ${iconMarginStyle}
      }
      bar-card-title {
        position: relative;
        text-align: ${textAlign};
        ${titlePositionStyle}
      }
      bar-card-valuecontainer {
        position: relative;
        display: ${config.show_minmax ? 'flex' : 'contents'};
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        ${config.show_minmax ? 'text-align: center;' : ''};
        ${valueflexDirection};
      }
      bar-card-value, bar-card-minvalue, bar-card-maxvalue {
        position: relative;
        font-weight: bold;
        font-size: 13px;
        color: #FFF;
        text-shadow: 1px 1px #0007;
        white-space: nowrap;
        ${config.show_minmax ? 'flex-grow: 1;' : ''};
        ${config.show_minmax ? 'text-align: center;' : ''};
      }
      bar-card-titlebar {
        position: relative;
        display: flex;
        align-items: center;
        height: 32px;
        ${titleAlign}
        ${titleWidth}
      }
      bar-card-indicatorbar {
        display: flex;
        --flex-direction: row;
        flex-direction: var(--flex-direction);
        align-items: var(--flex-align);
        justify-content: var(--justify-content);
      }
      bar-card-indicator {
        position: relative;
        filter: brightness(0.75);
        color: var(--bar-color);
        --padding-left: 0px;
        padding-left: var(--padding-left);
        --padding-right: 0px;
        padding-right: var(--padding-right);
      }
      bar-card-indicatorcontainer {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    return style;
  }

  // Create style string from CSS options
  _customStyle(style: any) {
    let styleString = '';

    Object.keys(style).forEach(section => {
      styleString = styleString + section + ':' + style[section] + '; ';
    });
    return styleString;
  }

  // Translates entity percentage to bar percentage
  _translatePercent(value: number, min: number, max: number, index: number, entity: string) {
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

  // Map range function
  _mapRange(num: number, in_min: number, in_max: number, out_min: number, out_max: number) {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  }

  // Returns color based on severity array
  _computeSeverity(stateValue: any, sections: any[], hass: any, config: any) {
    const numberValue = Number(stateValue);
    let color: null | string = null;

    sections.forEach(section => {
      let actualValue = this._valueEntityCheck(section.value, hass);
      if (isNaN(actualValue)) {
        if (actualValue == stateValue && color == null) {
          color = section.color;
        }
      }
      if (numberValue <= actualValue && color == null) {
        color = section.color;
      }
    });
    if (color == null) color = config.color;
    return color;
  }

  // Returns icon based on severity array
  _computeSeverityIcon(stateValue: any, sections: any[], hass: any) {
    let numberValue = Number(stateValue);
    let icon: null | string = null;
    sections.forEach(section => {
      let actualValue = this._valueEntityCheck(section.value, hass);
      if (isNaN(actualValue)) {
        if (actualValue == stateValue && icon == null) {
          icon = section.icon;
        }
      }
      if (numberValue <= actualValue && icon == null) {
        icon = section.icon;
      }
    });
    return icon;
  }

  // Check if value is NaN, otherwise assume it's an entity
  _valueEntityCheck(value: any, hass: any) {
    if (isNaN(value)) {
      const valueArray = value.split('.');
      if (valueArray[2] == 'attributes') {
        if (this._hass.states[valueArray[0] + '.' + valueArray[1]] == undefined) {
          throw new Error('Invalid target, min or max entity');
        } else {
          const hassObject = hass.states[valueArray[0] + '.' + valueArray[1]];
          const attributes = hassObject[valueArray[2]];
          const attribute = attributes[valueArray[3]];
          return attribute;
        }
      } else {
        if (this._hass.states[value] == undefined) return value;
        else return hass.states[value].state;
      }
    } else {
      return value;
    }
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

  // Update bar percentages
  _updateBar(entityState: any, hass: any, id: string, entity: string, index: number) {
    const minValue = this._valueEntityCheck(this._minCheck(entity, hass, index), hass);
    const maxValue = this._valueEntityCheck(this._maxCheck(entity, hass, index), hass);
    const barElement: any = this.shadowRoot.getElementById('bar_' + id);

    if (!isNaN(entityState)) {
      barElement.style.setProperty('--bar-percent', `${this._translatePercent(entityState, minValue, maxValue, index, entity)}%`);
      barElement.style.setProperty('--bar-charge-percent', `${this._translatePercent(entityState, minValue, maxValue, index, entity)}%`);
    } else {
      barElement.style.setProperty('--bar-percent', `100%`);
      barElement.style.setProperty('--bar-charge-percent', `100%`);
    }
  }

  // Create animation
  _updateAnimation(entityState: any, configDuration: number, configStop: boolean, id: string, entity: string, index: number) {
    const config = this._configAttributeCheck(entity, index);
    const root: any = this.shadowRoot;
    const hass = this._hass;
    const element = root.getElementById('chargeBar_' + id);
    const minValue = this._valueEntityCheck(this._minCheck(entity, hass, index), hass);
    const maxValue = this._valueEntityCheck(this._maxCheck(entity, hass, index), hass);
    let configDirection = this._animationDirection[id];
    let currentPercent = this._translatePercent(entityState, minValue, maxValue, index, entity);
    let totalFrames = currentPercent * 3 + config.delay / (config.speed / 250) / 3;
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
  _updateIndicator(config: any, position: string, direction: string, id: string, color: string) {
    const root: any = this.shadowRoot;
    const indicatorElement = root.getElementById('indicator_' + id);
    const indicatorBarElement = root.getElementById('indicatorBar_' + id);

    indicatorElement.style.setProperty('--bar-color', color);

    switch (direction) {
      case 'up':
        indicatorElement.textContent = '▲';
        switch (position) {
          case 'left':
            indicatorElement.style.setProperty('--padding-left', '4px');
            break;
          case 'right':
          case 'auto':
            root.getElementById('background_' + id).style.setProperty('--flex-direction', 'row-reverse');
            switch (config.align) {
              case 'center':
              case 'center-split':
              case 'left-split':
              case 'right-split':
                indicatorBarElement.style.setProperty('--justify-content', 'flex-end');
            }
            indicatorElement.style.setProperty('--padding-right', '4px');
            indicatorElement.style.setProperty('--padding-left', '0px');
            break;
          case 'top':
          case 'auto-vertical':
            indicatorBarElement.style.setProperty('--justify-content', 'flex-start');
            indicatorBarElement.style.setProperty('--flex-direction', 'column');
            break;
          case 'bottom':
            indicatorBarElement.style.setProperty('--justify-content', 'flex-end');
            indicatorBarElement.style.setProperty('--flex-direction', 'column');
        }
        break;
      case 'down':
        indicatorElement.textContent = '▼';
        switch (position) {
          case 'right':
            root.getElementById('background_' + id).style.setProperty('--flex-direction', 'row-reverse');
            indicatorElement.style.setProperty('--padding-right', '4px');
            indicatorElement.style.setProperty('--padding-left', '0px');
            break;
          case 'left':
          case 'auto':
            root.getElementById('background_' + id).style.setProperty('--flex-direction', 'row');
            switch (config.align) {
              case 'center':
              case 'center-split':
              case 'left-split':
              case 'right-split':
                indicatorBarElement.style.setProperty('--justify-content', 'flex-start');
            }
            indicatorElement.style.setProperty('--padding-left', '4px');
            indicatorElement.style.setProperty('--padding-right', '0px');
            break;
          case 'bottom':
          case 'auto-vertical':
            indicatorBarElement.style.setProperty('--justify-content', 'flex-end');
            indicatorBarElement.style.setProperty('--flex-direction', 'column');
          case 'top':
            indicatorBarElement.style.setProperty('--justify-content', 'flex-start');
            indicatorBarElement.style.setProperty('--flex-direction', 'column');
        }
        break;
      case 'off':
        indicatorElement.textContent = '';
        indicatorElement.style.setProperty('--padding-left', '0px');
        indicatorElement.style.setProperty('--padding-right', '0px');
    }
  }

  // Scale the target bar size
  _updateTargetBar(entityState: any, target: number, color: string, id: string, entity: string, index: number) {
    const config = this._configAttributeCheck(entity, index);
    const root: any = this.shadowRoot;
    const targetBarElement = root.getElementById('targetBar_' + id);
    const targetMarkerElement = root.getElementById('targetMarker_' + id);
    if (config.target) {
      const hass = this._hass;
      const minValue = this._valueEntityCheck(this._minCheck(entity, hass, index), hass);
      const maxValue = this._valueEntityCheck(this._maxCheck(entity, hass, index), hass);
      const currentPercent = this._translatePercent(entityState, minValue, maxValue, index, entity);
      const targetPercent = this._translatePercent(target, minValue, maxValue, index, entity);
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

  _calculateBarColor(config: any, entityState: string, hass: any) {
    let barColor;
    if (!config.severity) barColor = config.color;
    else barColor = this._computeSeverity(entityState, config.severity, hass, config);
    return barColor;
  }

  // Check entity attribute overrides
  _configAttributeCheck(entity: string, index: number) {
    const hass = this._hass;
    const config = Object.assign({}, this._configArray[index]);
    const entityAttributes = hass.states[entity].attributes;
    if (config.entity_config == true) {
      Object.keys(config).forEach(section => {
        if (this._initialConfigArray[index][section] == undefined) {
          if (entityAttributes[section] !== undefined) {
            if (section == 'severity' && typeof entityAttributes[section] == 'string') config[section] = JSON.parse(entityAttributes[section]);
            else config[section] = entityAttributes[section];
          }
        }
      });
    }
    return config;
  }

  // On entity update
  _updateEntity(entity: string, id: string, index: number) {
    const hass = this._hass;
    const entityObject = hass.states[entity];
    const root: any = this.shadowRoot;

    // Check if entity exists
    if (entityObject == undefined) {
      const container = root.getElementById('container_' + id);
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      const warning = document.createElement('hui-warning');
      warning.textContent = `Entity not available: ${entity}`;
      root.getElementById('card_' + id).appendChild(warning);
      return;
    }

    // Define config
    const config = this._configAttributeCheck(entity, index);

    // Define title
    if (!config.title) config.title = entityObject.attributes.friendly_name;

    // Check for title position config
    if (config.title_position != 'off') root.getElementById('title_' + id).textContent = config.title;
    if (!this._entityState) this._entityState = [];

    // Define variables that have possible entities
    let configTarget;
    if (config.target) configTarget = this._valueEntityCheck(config.target, hass);
    const configMin = this._valueEntityCheck(this._minCheck(entity, hass, index), hass);
    const configMax = this._valueEntityCheck(this._maxCheck(entity, hass, index), hass);

    // Define Entity State
    let entityState;
    if (entityObject == undefined || entityObject.state == 'unknown' || entityObject.state == 'unavailable') {
      entityState = 'N/A';
    } else {
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

      if (config.decimal) {
        entityState = entityState.toFixed(config.decimal);
      }
    }

    // Define Icon
    if (config.icon_position != 'off') {
      if (!config.icon) {
        root.getElementById('icon_' + id).icon = entityObject.attributes.icon;
      } else {
        if (!config.severity || this._computeSeverityIcon(entityState, config.severity, hass) == undefined) {
          root.getElementById('icon_' + id).icon = config.icon;
        } else {
          root.getElementById('icon_' + id).icon = this._computeSeverityIcon(entityState, config.severity, hass);
        }
      }
    } else {
      root.getElementById('icon_' + id).style.setProperty('--icon-display', 'none');
    }

    // Set measurement
    let measurement;
    if (entityObject == undefined || entityObject.state == 'unknown') measurement = '';
    else if (config.unit_of_measurement) measurement = config.unit_of_measurement;
    else measurement = entityObject.attributes.unit_of_measurement || '';

    // Define target, min and max if not defined
    if (!this._entityTarget) this._entityTarget = {};
    if (!this._currentMin) this._currentMin = {};
    if (!this._currentMax) this._currentMax = {};

    // Defined elements
    const barElement = root.getElementById('bar_' + id);

    // Define global currentAnimation
    if (!this._currentAnimation) this._currentAnimation = {};
    if (!this._animationDirection) this._animationDirection = {};

    // Define chargeEntityState
    let chargeEntityState;
    if (config.charge_entity) chargeEntityState = hass.states[config.charge_entity].state;

    // On entity update
    if (entityState !== this._entityState[id]) {
      const barColor = this._calculateBarColor(config, entityState, hass);

      if (!isNaN(entityState)) {
        if (config.visibility) {
          if (entityState == 'N/A' || config.visibility == true) {
            root.getElementById('card_' + id).style.setProperty('--card-display', 'visible');
          } else {
            if (eval(entityState + ' ' + config.visibility)) {
              root.getElementById('card_' + id).style.setProperty('--card-display', 'visible');
            } else {
              root.getElementById('card_' + id).style.setProperty('--card-display', 'none');
            }
          }
        }
      }
      this._updateBar(entityState, hass, id, entity, index);
      this._updateTargetBar(entityState, configTarget, barColor, id, entity, index);
      this._entityTarget[id] = configTarget;
      barElement.style.setProperty('--bar-color', barColor);
      if (config.show_minmax == true) {
        root.getElementById('min_value_' + id).textContent = `${configMin} ${measurement}`;
        root.getElementById('max_value_' + id).textContent = `${configMax} ${measurement}`;
      }
      if (config.show_value == true) root.getElementById('value_' + id).textContent = `${entityState} ${measurement}`;
      if (config.animation !== 'off') root.getElementById('chargeBar_' + id).style.setProperty('--bar-color', barColor);
      if (entityState == 'N/A') root.getElementById('backgroundBar_' + id).style.setProperty('--bar-color', '#666');
      else root.getElementById('backgroundBar_' + id).style.setProperty('--bar-color', barColor);

      if (config.indicator !== 'off') {
        if (entityState > this._entityState[id]) this._updateIndicator(config, config.indicator, 'up', id, barColor);
        if (entityState < this._entityState[id]) this._updateIndicator(config, config.indicator, 'down', id, barColor);
      }

      // Animation is auto
      if (config.animation == 'auto') {
        const barColor = this._calculateBarColor(config, entityState, hass);
        if (entityState > this._entityState[id]) {
          this._animationDirection[id] = 'normal';
          if (this._currentAnimation[id]) {
            this._currentAnimation[id].pause();
          }
          this._currentAnimation[id] = this._updateAnimation(entityState, config.delay, false, id, entity, index);
        }
        if (entityState < this._entityState[id]) {
          this._animationDirection[id] = 'reverse';
          if (this._currentAnimation[id]) {
            this._currentAnimation[id].pause();
          }
          this._currentAnimation[id] = this._updateAnimation(entityState, config.delay, false, id, entity, index);
        }
        if (entityState == configMax || entityState == configMin) {
          if (entityState == configMax) {
            barElement.style.setProperty('--bar-color', barColor);
            if (config.indicator !== 'off') this._updateIndicator(config, config.indicator, 'off', id, barColor);
            if (this._currentAnimation[id]) {
              this._currentAnimation[id].pause();
            }
          }
          if (entityState == configMin) {
            if (config.indicator !== 'off') this._updateIndicator(config, config.indicator, 'off', id, barColor);
            if (this._currentAnimation[id]) {
              this._currentAnimation[id].pause();
            }
          }
        }
      }
    }

    // Animation is charge
    if (config.charge_entity) {
      if (!this._currentChargeState) this._currentChargeState = {};
      if (this._currentChargeState[id] !== chargeEntityState || entityState !== this._entityState[id]) {
        const barColor = this._calculateBarColor(config, entityState, hass);
        switch (chargeEntityState) {
          case 'charging':
          case 'on':
          case 'true':
            if (config.indicator !== 'off') this._updateIndicator(config, config.indicator, 'up', id, barColor);
            if (!this._currentAnimation[id] || chargeEntityState != this._currentChargeState || entityState > this._entityState[id]) {
              this._currentChargeState[id] = chargeEntityState;
              this._animationDirection[id] = 'normal';
              this._currentAnimation[id] = this._updateAnimation(entityState, config.delay, false, id, entity, index);
            }
            break;
          case 'discharging':
          case 'off':
          case 'false':
            if (config.indicator !== 'off') this._updateIndicator(config, config.indicator, 'down', id, barColor);
            if (!this._currentAnimation[id] || chargeEntityState != this._currentChargeState || entityState < this._entityState[id]) {
              this._currentChargeState[id] = chargeEntityState;
              this._animationDirection[id] = 'reverse';
              this._currentAnimation[id] = this._updateAnimation(entityState, config.delay, false, id, entity, index);
            }
            break;
        }
      }
    }

    // On target update
    if (config.target) {
      if (configTarget != this._entityTarget[id]) {
        const barColor = this._calculateBarColor(config, entityState, hass);
        this._updateTargetBar(entityState, configTarget, barColor, id, entity, index);
        this._entityTarget[id] = configTarget;
        if (this._currentAnimation[id] && config.animation !== 'off') this._currentAnimation[id] = this._updateAnimation(entityState, config.delay, false, id, entity, index);
      }
    }

    // On min update
    if (configMin !== this._currentMin[id]) {
      this._updateBar(entityState, hass, id, entity, index);
      this._currentMin[id] = configMin;
      if (config.target) {
        const barColor = this._calculateBarColor(config, entityState, hass);
        this._updateTargetBar(entityState, configTarget, barColor, id, entity, index);
        this._currentMin[id] = configMin;
      }
      if (this._currentAnimation[id] && config.animation !== 'off') this._currentAnimation[id] = this._updateAnimation(entityState, config.delay, false, id, entity, index);
    }

    // On max update
    if (configMax !== this._currentMax[id]) {
      this._updateBar(entityState, hass, id, entity, index);
      this._currentMax[id] = configMax;
      if (config.target) {
        const barColor = this._calculateBarColor(config, entityState, hass);
        this._updateTargetBar(entityState, configTarget, barColor, id, entity, index);
        this._currentMax[id] = configMax;
      }
      if (this._currentAnimation[id] && config.animation !== 'off') this._currentAnimation[id] = this._updateAnimation(entityState, config.delay, false, id, entity, index);
    }
    this._entityState[id] = entityState;
  }

  getCardSize() {
    return 1;
  }
}

customElements.define('bar-card', BarCard);
