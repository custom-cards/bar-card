import { LitElement, html, customElement, property, CSSResult, TemplateResult, css, PropertyValues } from 'lit-element';
import {
  HomeAssistant,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  domainIcon,
  computeDomain,
} from 'custom-card-helpers';

import './editor';

import { BarCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';
import { mergeDeep, hasConfigOrEntitiesChanged } from './helpers';

/* eslint no-console: 0 */
console.info(
  `%c  BAR-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// TODO Name your custom element
@customElement('bar-card')
export class BarCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('bar-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): object {
    return {};
  }

  @property() public hass?: HomeAssistant;
  @property() private _config!: BarCardConfig;
  private _configArray!: BarCardConfig[];
  private _stateArray: any[] = [];
  private _animationState: any[] = [];

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntitiesChanged(this, changedProps, false);
  }

  public setConfig(config: BarCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    this._config = mergeDeep(
      {
        attribute: false,
        animation: {
          state: 'off',
          delay: 5000,
          speed: 1000,
        },
        color: 'var(--bar-card-color, var(--primary-color))',
        columns: 1,
        entity_row: false,
        icon: false,
        limit_value: false,
        max: 100,
        min: 0,
        positions: {
          icon: 'outside',
          indicator: 'outside',
          name: 'inside',
          minmax: 'off',
          value: 'inside',
        },
        severity: false,
        service_options: false,
        target: false,
        title: false,
        unit_of_measurement: false,
      },
      config,
    );

    if (this._config.stack) this._config.columns = this._config.entities.length;
    this._createConfigArray();
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }

    if (this._config.entity_row == true) {
      return html`
        ${this._createBarArray()}
      `;
    }

    return html`
      <ha-card .header=${this._config.title} tabindex="0" aria-label=${`Bar: ${this._config.entity}`}>
        <div id="states" class="card-content">
          ${this._createBarArray()}
        </div>
      </ha-card>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this._config && ev.detail.action) {
      handleAction(this, this.hass, this._config, ev.detail.action);
    }
  }

  private _createConfigArray(): void {
    this._configArray = [];
    if (this._config.entities) {
      for (const config of this._config.entities) {
        if (typeof config == 'string') {
          const clonedObject = mergeDeep({}, this._config);
          delete clonedObject.entities;
          const stringConfig = mergeDeep(clonedObject, { entity: config });
          this._configArray.push(stringConfig);
        } else if (typeof config == 'object') {
          const clonedObject = mergeDeep({}, this._config);
          delete clonedObject.entities;
          const objectConfig = mergeDeep(clonedObject, config);
          this._configArray.push(objectConfig);
        }
      }
    } else if (this._config.entity) {
      this._configArray.push(this._config);
    }
  }

  private _createBarArray(): TemplateResult[] {
    // Create array containing number of bars per row.
    const columnsArray: number[] = [];
    for (let i = 0; i < this._configArray.length; i++) {
      if ((columnsArray.length + 1) * this._config.columns == i) {
        columnsArray.push(this._config.columns);
      }
      if (this._configArray.length == i + 1) {
        columnsArray.push(this._configArray.length - columnsArray.length * this._config.columns);
      }
    }

    // For each row add contained bars based on columnsArray.
    const perRowArray: object[] = [];
    for (let i = 0; i < columnsArray.length; i++) {
      // For every number in columnsArray add bars.
      const currentRowArray: TemplateResult[] = [];
      for (let x = 0; x < columnsArray[i]; x++) {
        const index = i * this._config.columns + x;
        const config = this._configArray[index];
        const state = this.hass!.states[config.entity];
        if (!state) {
          currentRowArray.push(html`
            <div class="warning" style="margin-bottom: 8px;">
              ${localize('common.entity_not_available')}: ${config.entity}
            </div>
          `);
          continue;
        }

        // If decimal is defined check if NaN and apply number fix.
        let entityState = state.state;
        if (!isNaN(Number(entityState))) {
          if (config.decimal == 0) entityState = Number(entityState).toFixed(0);
          else if (config.decimal) entityState = Number(entityState).toFixed(config.decimal);
        }

        // Defined height and check for configured height.
        let barHeight = '40px';
        if (config.height) barHeight = config.height;

        // Set style variables based on direction. 
        let alignItems = 'stretch';
        let backgroundMargin = '0px 0px 0px 13px';
        let barDirection = 'right';
        let contentBarDirection = 'row';
        let flexDirection = 'row';
        let markerDirection = 'left';
        let valueMargin = '4px 4px 4px auto';
        let markerStyle = 'height: 100%; width: 2px;';

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
            backgroundMargin = '0px';
            barDirection = 'top';
            contentBarDirection = 'column';
            flexDirection = 'column-reverse';
            markerDirection = 'bottom';
            markerStyle = 'height: 2px; width: 100%;';
            valueMargin = 'auto 4px 4px 4px';
            break;
          case 'down':
          case 'down-reverse':
            barDirection = 'bottom';
            markerDirection = 'top';
            markerStyle = 'height: 2px; width: 100%;';
            contentBarDirection = 'column';
            flexDirection = 'column-reverse';
            backgroundMargin = '0px 0px 13px 0px';
            valueMargin = 'auto 4px 4px 4px';
            break;
        }

        // Set icon position html.
        let iconOutside;
        let iconInside;
        let icon;
        if (config.icon) {
          icon = config.icon;
        } else if (state.attributes.icon) {
          icon = state.attributes.icon;
        } else {
          icon = domainIcon(computeDomain(config.entity), entityState);
        }
        switch (config.positions.icon) {
          case 'outside':
            iconOutside = html`
              <bar-card-iconbar>
                <ha-icon icon="${icon}"> </ha-icon>
              </bar-card-iconbar>
            `;
            break;
          case 'inside':
            iconInside = html`
              <bar-card-iconbar style="margin: 0px 10px 0px 0px">
                <ha-icon icon="${icon}"> </ha-icon>
              </bar-card-iconbar>
            `;
            backgroundMargin = '0px';
            break;
          case 'off':
            backgroundMargin = '0px';
            break;
        }

        // Check for configured name otherwise use friendly name.
        const name = config.name ? config.name : state.attributes.friendly_name;

        // Set name margin based on direction.
        let nameMarginLeft = '13px';
        if (config.entity_row) {
          nameMarginLeft = '17px';
        }
        switch (config.direction) {
          case 'up':
          case 'up-reverse':
          case 'down':
          case 'down-reverse':
            nameMarginLeft = '0px';
            break;
        }

        // Set name html based on position.
        let nameOutside;
        let nameInside;
        switch (config.positions.name) {
          case 'outside':
            nameOutside = html`
              <bar-card-name style="width: calc(100% - ${config.width}); margin-left: ${nameMarginLeft};">
                ${name}
              </bar-card-name>
            `;
            backgroundMargin = '0px';
            break;
          case 'inside':
            nameInside = html`
              <bar-card-name>
                ${name}
              </bar-card-name>
            `;
            break;
          case 'off':
            break;
        }

        // Check for configured unit of measurement otherwise use attribute value.
        const unitOfMeasurement = config.unit_of_measurement
          ? config.unit_of_measurement
          : state.attributes.unit_of_measurement;

        // Set min and max html based on position.
          let minMaxOutside;
        let minMaxInside;
        switch (config.positions.minmax) {
          case 'outside':
            minMaxOutside = html`
              <bar-card-min>
                ${config.min}${unitOfMeasurement}
              </bar-card-min>
              <bar-card-divider>
                /
              </bar-card-divider>
              <bar-card-max>
                ${config.max}${unitOfMeasurement}
              </bar-card-max>
            `;
            break;
          case 'inside':
            minMaxInside = html`
              <bar-card-min style="margin-left: auto;">
                ${config.min}${unitOfMeasurement}
              </bar-card-min>
              <bar-card-divider>
                /
              </bar-card-divider>
              <bar-card-max>
                ${config.max}${unitOfMeasurement}
              </bar-card-max>
            `;
            break;
          case 'off':
            break;
        }

        // Set value html based on position.
        let valueOutside;
        let valueInside;
        switch (config.positions.value) {
          case 'outside':
            valueOutside = html`
              <bar-card-value style="margin: 4px;">
                ${entityState} ${unitOfMeasurement}
              </bar-card-value>
            `;
            break;
          case 'inside':
            valueInside = html`
              <bar-card-value
                style="${config.positions.minmax == 'inside' ? 'margin: 4px' : 'margin: ' + valueMargin};"
              >
                ${entityState} ${unitOfMeasurement}
              </bar-card-value>
            `;
            break;
          case 'off':
            backgroundMargin = '0px';
            break;
        }

        // Set indicator and animation state based on value change.
        let indicatorText = '';
        if (entityState > this._stateArray[index]) {
          indicatorText = '▲';
          if (config.direction == 'up') this._animationState[index] = 'animation-increase-vertical';
          else this._animationState[index] = 'animation-increase';
        } else if (entityState < this._stateArray[index]) {
          indicatorText = '▼';
          if (config.direction == 'up') this._animationState[index] = 'animation-decrease-vertical';
          else this._animationState[index] = 'animation-decrease';
        } else {
          this._animationState[index] = this._animationState[index];
        }

        // Set bar color.
        const barColor = this._computeBarColor(entityState, index);

        // Set indicator html based on position.
        let indicatorOutside;
        let indicatorInside;
        switch (config.positions.indicator) {
          case 'outside':
            indicatorOutside = html`
              <bar-card-indicator style="--bar-color: ${barColor};">
                ${indicatorText}
              </bar-card-indicator>
            `;
            break;
          case 'inside':
            indicatorInside = html`
              <bar-card-indicator style="--bar-color: ${barColor};">
                ${indicatorText}
              </bar-card-indicator>
            `;
            break;
          case 'off':
            break;
        }

        // Set bar percent and marker percent based on value difference.
        const barPercent = this._computePercent(entityState, index);
        const targetMarkerPercent = this._computePercent(config.target, index);
        let targetStartPercent = barPercent;
        let targetEndPercent = this._computePercent(config.target, index);
        if (targetEndPercent < targetStartPercent) {
          targetStartPercent = targetEndPercent;
          targetEndPercent = barPercent;
        }

        // Set bar width if configured.
        let barWidth = '';
        if (config.width) {
          alignItems = 'center';
          barWidth = `width: ${config.width}`;
        }

        // Set animation state inside array.
        const animation = this._animationState[index];
        let animationDirection = 'right';
        let animationPercent = barPercent * 100;
        let animationClass = 'animationbar-horizontal';
        if (animation == 'animation-increase-vertical' || animation == 'animation-decrease-vertical') {
          animationDirection = 'bottom';
          animationClass = 'animationbar-vertical';
          animationPercent = (100 - barPercent) * 100;
        }

        // Add current bar to row array.
        currentRowArray.push(html`
          <bar-card-card
            style="flex-direction: ${flexDirection}; align-items: ${alignItems};"
            @action=${this._handleAction}
            .actionHandler=${actionHandler({
              hasHold: hasAction(config.hold_action),
              hasDoubleTap: hasAction(config.double_tap_action),
              repeat: config.hold_action ? config.hold_action.repeat : undefined,
            })}
          >
            ${iconOutside} ${indicatorOutside} ${nameOutside}
            <bar-card-background style="height: ${barHeight}; margin: ${backgroundMargin}; ${barWidth}">
              <bar-card-backgroundbar style="--bar-color: ${barColor};"> </bar-card-backgroundbar>
              ${config.animation.state == 'on'
                ? html`
                    <bar-card-animationbar
                      style="animation: ${animation} 5s infinite ease-out; --bar-percent: ${animationPercent}%; --bar-color: ${barColor}; --animation-direction: ${animationDirection};"
                      class="${animationClass}"
                    >
                    </bar-card-animationbar>
                  `
                : ''}
              <bar-card-currentbar
                style="--bar-color: ${barColor}; --bar-percent: ${barPercent}%; --bar-direction: ${barDirection}"
              >
              </bar-card-currentbar>
              ${config.target
                ? html`
                    <bar-card-targetbar
                      style="--bar-color: ${barColor}; --bar-percent: ${targetStartPercent}%; --bar-target-percent: ${targetEndPercent}%; --bar-direction: ${barDirection}; "
                    >
                    </bar-card-targetbar>
                    <bar-card-markerbar
                      style="--bar-color: ${barColor}; --bar-target-percent: ${targetMarkerPercent}%; ${markerDirection}: calc(${targetMarkerPercent}% - 1px); ${markerStyle}}"
                    >
                    </bar-card-markerbar>
                  `
                : ''}
              <bar-card-contentbar style="flex-direction: ${contentBarDirection};">
                ${iconInside} ${indicatorInside} ${nameInside} ${minMaxInside} ${valueInside}
              </bar-card-contentbar>
            </bar-card-background>
            ${minMaxOutside} ${valueOutside}
          </bar-card-card>
        `);

        // Set entity state inside array if changed.
        if (entityState !== this._stateArray[index]) {
          this._stateArray[index] = entityState;
        }
      }

      // Add all bars for this row to array.
      perRowArray.push(currentRowArray);
    }

    // Create array containing all rows.
    let rowFlexDirection = 'column';
    if (this._config.columns || this._config.stack) rowFlexDirection = 'row';

    const rowArray: TemplateResult[] = [];
    for (const row of perRowArray) {
      rowArray.push(html`
        <bar-card-row style="flex-direction: ${rowFlexDirection}; margin-bottom: 8px;">${row}</bar-card-row>
      `);
    }
    return rowArray;
  }

  private _computeBarColor(value: string, index: number): string {
    const config = this._configArray[index];
    let barColor;
    if (config.severity) barColor = this._computeSeverity(value, index);
    else barColor = config.color;
    return barColor;
  }

  private _computeSeverity(value: string, index: number): unknown {
    const config = this._configArray[index];
    const numberValue = Number(value);
    const sections = config.severity;
    let color: undefined | string;

    sections.forEach(section => {
      if (isNaN(section.value)) {
        if (section.value == value && color == undefined) {
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

  private _computePercent(value: string, index: number): number {
    const config = this._configArray[index];
    const numberValue = Number(value);

    if (isNaN(numberValue)) return 100;

    switch (config.direction) {
      case 'right-reverse':
      case 'left-reverse':
      case 'up-reverse':
      case 'down-reverse':
        return 100 - (100 * (numberValue - config.min)) / (config.max - config.min);
      default:
        return (100 * (numberValue - config.min)) / (config.max - config.min);
    }
  }

  static get styles(): CSSResult {
    return css`
      .warning {
        display: block;
        color: black;
        background-color: #fce588;
        padding: 8px;
      }
      #states {
        flex: 1 1 0%;
      }
      #states > * {
        margin: 8px 0px;
      }
      bar-card-row {
        display: flex;
        justify-content: stretch;
      }
      bar-card-row:last-child {
        margin-bottom: 0px;
      }
      bar-card-row > div {
        flex-basis: 100%;
      }
      bar-card-card {
        display: flex;
        flex-basis: 100%;
        flex-direction: row;
        margin-right: 8px;
      }
      bar-card-card:last-child {
        margin-right: 0px;
      }
      bar-card-background {
        cursor: pointer;
        flex-grow: 1;
        position: relative;
      }
      bar-card-iconbar {
        color: var(--icon-color, var(--paper-item-icon-color));
        align-items: center;
        align-self: center;
        display: flex;
        height: 40px;
        justify-content: center;
        position: relative;
        width: 40px;
      }
      bar-card-currentbar,
      bar-card-backgroundbar,
      bar-card-contentbar,
      bar-card-targetbar,
      bar-card-animationbar {
        position: absolute;
        height: 100%;
        width: 100%;
        border-radius: var(--bar-card-border-radius, var(--ha-card-border-radius));
      }
      bar-card-contentbar {
        align-items: center;
        color: var(--primary-text-color);
        display: flex;
        justify-content: flex-start;
      }
      bar-card-backgroundbar {
        background: var(--bar-color);
        filter: brightness(0.5);
        opacity: 0.25;
      }
      bar-card-currentbar {
        background: linear-gradient(
          to var(--bar-direction),
          var(--bar-color) var(--bar-percent),
          #0000 var(--bar-percent),
          #0000 var(--bar-percent)
        );
      }
      bar-card-targetbar {
        background: linear-gradient(
          to var(--bar-direction),
          #0000 var(--bar-percent),
          var(--bar-color) var(--bar-percent),
          var(--bar-color) var(--bar-target-percent),
          #0000 var(--bar-target-percent)
        );
        display: var(--target-display);
        filter: brightness(0.66);
        opacity: 0.33;
      }
      bar-card-markerbar {
        background: var(--bar-color);
        filter: brightness(0.75);
        opacity: 50%;
        position: absolute;
      }
      bar-card-animationbar {
        background-repeat: no-repeat;
        filter: brightness(0.75);
        opacity: 0%;
      }
      .animationbar-horizontal {
        background: linear-gradient(to var(--animation-direction), var(--bar-color) 0%, var(--bar-color) 1%, #0000 1%);
      }
      .animationbar-vertical {
        background: linear-gradient(to var(--animation-direction), #0000 0%, #0000 1%, var(--bar-color) 1%);
      }
      @keyframes animation-increase {
        0% {
          opacity: 50%;
          background-size: var(--bar-percent) 100%;
        }
        100% {
          opacity: 0%;
          background-size: 10000% 100%;
        }
      }
      @keyframes animation-decrease {
        0% {
          opacity: 0%;
          background-size: 10000%;
        }
        100% {
          opacity: 50%;
          background-size: var(--bar-percent);
        }
      }
      @keyframes animation-increase-vertical {
        0% {
          opacity: 50%;
          background-size: 100% var(--bar-percent);
        }
        100% {
          background-size: 100% 0%;
          opacity: 0%;
        }
      }
      @keyframes animation-decrease-vertical {
        0% {
          background-size: 100% 100%;
          opacity: 0%;
        }
        100% {
          opacity: 50%;
          background-size: 100% var(--bar-percent);
        }
      }
      bar-card-indicator {
        align-self: center;
        color: var(--bar-color);
        filter: brightness(0.75);
        height: 16px;
        width: 16px;
        position: relative;
        text-align: center;
        margin-right: -16px;
        left: -6px;
      }
      bar-card-name {
        align-items: center;
        align-self: center;
        justify-content: center;
        margin: 4px;
        overflow: hidden;
        position: relative;
        text-align: left;
        text-overflow: ellipsis;
      }
      bar-card-value,
      bar-card-min,
      bar-card-max,
      bar-card-divider {
        align-self: center;
        position: relative;
      }
      bar-card-min,
      bar-card-max,
      bar-card-divider {
        font-size: 10px;
        margin: 2px;
        opacity: 0.5;
      }
      bar-card-divider {
        margin-left: 0px;
        margin-right: 0px;
      }
      bar-card-value {
        white-space: nowrap;
      }
    `;
  }
}
