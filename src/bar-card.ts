import { LitElement, html, customElement, property, CSSResult, TemplateResult, css, PropertyValues } from 'lit-element';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers';

import './editor';

import { BarCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';
import { mergeDeep } from './helpers';

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
  @property() private _configArray!: BarCardConfig[];

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this._configArray, changedProps, true);
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
        decimal: false,
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

        let barHeight = '40px';
        if (config.height) barHeight = config.height;

        let backgroundMargin = '0px 0px 0px 10px';
        let barDirection = 'right';
        let contentBarDirection = 'row';
        let flexDirection = 'row';
        let markerDirection: string;
        let valueMargin = '4px 4px 4px auto';
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
            valueMargin = 'auto 4px 4px 4px';
            break;
          case 'down':
          case 'down-reverse':
            barDirection = 'bottom';
            markerDirection = 'top';
            contentBarDirection = 'column';
            flexDirection = 'column-reverse';
            backgroundMargin = '0px 0px 10px 0px';
            valueMargin = 'auto 4px 4px 4px';
            break;
        }

        let iconOutside;
        let iconInside;
        switch (config.positions.icon) {
          case 'outside':
            iconOutside = html`
              <bar-card-iconbar>
                <ha-icon icon="mdi:bed-empty"> </ha-icon>
              </bar-card-iconbar>
            `;
            break;
          case 'inside':
            iconInside = html`
              <bar-card-iconbar style="margin: 0px 10px 0px 0px">
                <ha-icon icon="mdi:bed-empty"> </ha-icon>
              </bar-card-iconbar>
            `;
            backgroundMargin = '0px';
            break;
          case 'off':
            backgroundMargin = '0px';
            break;
        }

        const name = config.name ? config.name : state.attributes.friendly_name;
        let nameOutside;
        let nameInside;
        switch (config.positions.name) {
          case 'outside':
            nameOutside = html`
              <bar-card-name>
                ${name}
              </bar-card-name>
            `;
            break;
          case 'inside':
            nameInside = html`
              <bar-card-name>
                ${name}
              </bar-card-name>
            `;
            break;
          case 'off':
            backgroundMargin = '0px';
            break;
        }

        const unitOfMeasurement = config.unit_of_measurement
          ? config.unit_of_measurement
          : state.attributes.unit_of_measurement;

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
            backgroundMargin = '0px';
            break;
        }

        let valueOutside;
        let valueInside;
        switch (config.positions.value) {
          case 'outside':
            valueOutside = html`
              <bar-card-value style="margin: 4px;">
                ${state.state} ${unitOfMeasurement}
              </bar-card-value>
            `;
            break;
          case 'inside':
            valueInside = html`
              <bar-card-value
                style="${config.positions.minmax == 'inside' ? 'margin: 4px' : 'margin: 4px 4px 4px auto'};"
              >
                ${state.state} ${unitOfMeasurement}
              </bar-card-value>
            `;
            break;
          case 'off':
            backgroundMargin = '0px';
            break;
        }

        const barColor = this._computeBarColor(state.state, index);
        const barPercent = this._computePercent(state.state, index);
        currentRowArray.push(html`
          <bar-card-card
            style="flex-direction: ${flexDirection};"
            @action=${this._handleAction}
            .actionHandler=${actionHandler({
              hasHold: hasAction(config.hold_action),
              hasDoubleTap: hasAction(config.double_tap_action),
              repeat: config.hold_action ? config.hold_action.repeat : undefined,
            })}
          >
            ${iconOutside} ${nameOutside}
            <bar-card-background style="height: ${barHeight}; margin: ${backgroundMargin};">
              <bar-card-backgroundbar class="bar" style="--bar-color: ${barColor};"> </bar-card-backgroundbar>
              <bar-card-currentbar
                class="bar"
                style="--bar-color: ${barColor}; --bar-percent: ${barPercent}%; --bar-direction: ${barDirection}"
              >
              </bar-card-currentbar>
              <bar-card-contentbar class="bar" style="flex-direction: ${contentBarDirection};">
                ${iconInside} ${nameInside} ${minMaxInside} ${valueInside}
              </bar-card-contentbar>
            </bar-card-background>
            ${minMaxOutside} ${valueOutside}
          </bar-card-card>
        `);
      }
      perRowArray.push(currentRowArray);
    }

    // Create array containing all rows.
    let rowFlexDirection = 'column';
    if (this._config.columns || this._config.stack) rowFlexDirection = 'row';

    const rowArray: TemplateResult[] = [];
    for (const row of perRowArray) {
      rowArray.push(html`
        <bar-card-row style="flex-direction: ${rowFlexDirection};">${row}</bar-card-row>
      `);
    }

    return rowArray;
  }

  private _computeBarColor(state: string, index: number): string {
    const config = this._configArray[index];
    let barColor;
    if (config.severity) barColor = this._computeSeverity(state, index);
    else barColor = config.color;
    return barColor;
  }

  private _computeSeverity(state: string, index: number): unknown {
    const config = this._configArray[index];
    const numberValue = Number(state);
    const sections = config.severity;
    let color: undefined | string;

    sections.forEach(section => {
      if (isNaN(section.value)) {
        if (section.value == state && color == undefined) {
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
      bar-card-row > div {
        flex-basis: 100%;
      }
      bar-card-card {
        align-items: stretch;
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
      bar-card-contentbar {
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
