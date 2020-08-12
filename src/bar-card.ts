import { LitElement, html, customElement, property, TemplateResult, PropertyValues } from 'lit-element';
import {
  HomeAssistant,
  hasAction,
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
import { mergeDeep, hasConfigOrEntitiesChanged, createConfigArray } from './helpers';
import { styles } from './styles';

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
  @property() private _configArray: BarCardConfig[] = [];
  private _stateArray: any[] = [];
  private _animationState: any[] = [];
  private _rowAmount = 1;

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntitiesChanged(this, changedProps, false);
  }

  public setConfig(config: BarCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    this._config = mergeDeep(
      {
        animation: {
          state: 'off',
          speed: 5,
        },
        color: 'var(--bar-card-color, var(--primary-color))',
        columns: 1,
        direction: 'right',
        max: 100,
        min: 0,
        positions: {
          icon: 'outside',
          indicator: 'outside',
          name: 'inside',
          minmax: 'off',
          value: 'inside',
        },
      },
      config,
    );

    if (this._config.stack == 'horizontal') this._config.columns = this._config.entities.length;
    this._configArray = createConfigArray(this._config);
    this._rowAmount = this._configArray.length / this._config.columns;
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }

    return html`
      <ha-card
        .header=${this._config.title ? this._config.title : null}
        style="${this._config.entity_row ? 'background: #0000; box-shadow: none;' : ''}"
      >
        <div
          id="states"
          class="card-content"
          style="${this._config.entity_row ? 'padding: 0px;' : ''} ${this._config.direction == 'up'
            ? ''
            : 'flex-grow: 0;'}"
        >
          ${this._createBarArray()}
        </div>
      </ha-card>
      ${styles}
    `;
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

        // If attribute is defined use attribute value as bar value.
        let entityState;
        if (config.attribute) {
          entityState = state.attributes[config.attribute];
        } else {
          entityState = state.state;
        }

        // Contine if severity hide is defined.
        if (config.severity) {
          if (this._computeSeverityVisibility(entityState, index)) {
            continue;
          }
        }

        // If limit_value is defined limit the displayed value to min and max.
        if (config.limit_value) {
          entityState = Math.min(entityState, config.max);
          entityState = Math.max(entityState, config.min);
        }

        // If decimal is defined check if NaN and apply number fix.
        if (!isNaN(Number(entityState))) {
          if (config.decimal == 0) entityState = Number(entityState).toFixed(0);
          else if (config.decimal) entityState = Number(entityState).toFixed(config.decimal);
        }

        // Defined height and check for configured height.
        let barHeight: string | number = 40;
        if (config.height) barHeight = config.height;

        // Set style variables based on direction.
        let alignItems = 'stretch';
        let backgroundMargin = '0px 0px 0px 13px';
        let barDirection = 'right';
        let flexDirection = 'row';
        let markerDirection = 'left';
        let markerStyle = 'height: 100%; width: 2px;';

        switch (config.direction) {
          case 'right':
            barDirection = 'right';
            markerDirection = 'left';
            break;
          case 'up':
            backgroundMargin = '0px';
            barDirection = 'top';
            flexDirection = 'column-reverse';
            markerDirection = 'bottom';
            markerStyle = 'height: 2px; width: 100%;';
            break;
        }

        // Set icon position html.
        let iconOutside;
        let iconInside;
        let icon;
        if (this._computeSeverityIcon(entityState, index)) {
          icon = this._computeSeverityIcon(entityState, index);
        } else if (config.icon) {
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
                <ha-icon icon="${icon}"></ha-icon>
              </bar-card-iconbar>
            `;
            break;
          case 'inside':
            iconInside = html`
              <bar-card-iconbar>
                <ha-icon icon="${icon}"></ha-icon>
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

        // Set name html based on position.
        let nameOutside;
        let nameInside;
        switch (config.positions.name) {
          case 'outside':
            nameOutside = html`
              <bar-card-name
                class="${config.entity_row ? 'name-outside' : ''}"
                style="${config.direction == 'up' ? '' : config.width ? `width: calc(100% - ${config.width});` : ''}"
                >${name}</bar-card-name
              >
            `;
            backgroundMargin = '0px';
            break;
          case 'inside':
            nameInside = html`
              <bar-card-name>${name}</bar-card-name>
            `;
            break;
          case 'off':
            break;
        }

        // Check for configured unit of measurement otherwise use attribute value.
        let unitOfMeasurement;
        if (isNaN(Number(entityState))) {
          unitOfMeasurement = '';
        } else {
          if (config.unit_of_measurement) {
            unitOfMeasurement = config.unit_of_measurement;
          } else {
            unitOfMeasurement = state.attributes.unit_of_measurement;
          }
        }

        // Set min and max html based on position.
        let minMaxOutside;
        let minMaxInside;
        switch (config.positions.minmax) {
          case 'outside':
            minMaxOutside = html`
              <bar-card-min>${config.min}${unitOfMeasurement}</bar-card-min>
              <bar-card-divider>/</bar-card-divider>
              <bar-card-max>${config.max}${unitOfMeasurement}</bar-card-max>
            `;
            break;
          case 'inside':
            minMaxInside = html`
              <bar-card-min class="${config.direction == 'up' ? 'min-direction-up' : 'min-direction-right'}"
                >${config.min}${unitOfMeasurement}</bar-card-min
              >
              <bar-card-divider>/</bar-card-divider>
              <bar-card-max> ${config.max}${unitOfMeasurement}</bar-card-max>
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
              <bar-card-value class="${config.direction == 'up' ? 'value-direction-up' : 'value-direction-right'}"
                >${config.complementary ? config.max - entityState : entityState} ${unitOfMeasurement}</bar-card-value
              >
            `;
            break;
          case 'inside':
            valueInside = html`
              <bar-card-value
                class="${config.positions.minmax == 'inside'
                  ? ''
                  : config.direction == 'up'
                  ? 'value-direction-up'
                  : 'value-direction-right'}"
                >${config.complementary ? config.max - entityState : entityState} ${unitOfMeasurement}</bar-card-value
              >
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
        if (isNaN(Number(entityState))) {
          indicatorText = '';
        }

        // Set bar color.
        const barColor = this._computeBarColor(entityState, index);

        // Set indicator html based on position.
        let indicatorOutside;
        let indicatorInside;
        switch (config.positions.indicator) {
          case 'outside':
            indicatorOutside = html`
              <bar-card-indicator
                class="${config.direction == 'up' ? '' : 'indicator-direction-right'}"
                style="--bar-color: ${barColor};"
                >${indicatorText}</bar-card-indicator
              >
            `;
            break;
          case 'inside':
            indicatorInside = html`
              <bar-card-indicator style="--bar-color: ${barColor};">${indicatorText}</bar-card-indicator>
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
            .config=${config}
            .actionHandler=${actionHandler({
              hasHold: hasAction(config.hold_action),
              hasDoubleClick: hasAction(config.double_tap_action),
            })}
          >
            ${iconOutside} ${indicatorOutside} ${nameOutside}
            <bar-card-background
              style="margin: ${backgroundMargin}; height: ${barHeight}${typeof barHeight == 'number'
                ? 'px'
                : ''}; ${barWidth}"
            >
              <bar-card-backgroundbar style="--bar-color: ${barColor};"></bar-card-backgroundbar>
              ${config.animation.state == 'on'
                ? html`
                    <bar-card-animationbar
                      style="animation: ${animation} ${config.animation
                        .speed}s infinite ease-out; --bar-percent: ${animationPercent}%; --bar-color: ${barColor}; --animation-direction: ${animationDirection};"
                      class="${animationClass}"
                    ></bar-card-animationbar>
                  `
                : ''}
              <bar-card-currentbar
                style="--bar-color: ${barColor}; --bar-percent: ${barPercent}%; --bar-direction: ${barDirection}"
              ></bar-card-currentbar>
              ${config.target
                ? html`
                    <bar-card-targetbar
                      style="--bar-color: ${barColor}; --bar-percent: ${targetStartPercent}%; --bar-target-percent: ${targetEndPercent}%; --bar-direction: ${barDirection};"
                    ></bar-card-targetbar>
                    <bar-card-markerbar
                      style="--bar-color: ${barColor}; --bar-target-percent: ${targetMarkerPercent}%; ${markerDirection}: calc(${targetMarkerPercent}% - 1px); ${markerStyle}}"
                    ></bar-card-markerbar>
                  `
                : ''}
              <bar-card-contentbar
                class="${config.direction == 'up' ? 'contentbar-direction-up' : 'contentbar-direction-right'}"
              >
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
        <bar-card-row style="flex-direction: ${rowFlexDirection};">${row}</bar-card-row>
      `);
    }
    return rowArray;
  }

  private _computeBarColor(value: string, index: number): string {
    const config = this._configArray[index];
    let barColor;
    if (config.severity) {
      barColor = this._computeSeverityColor(value, index);
    } else if (value == 'unavailable') {
      barColor = `var(--bar-card-disabled-color, ${config.color})`;
    } else {
      barColor = config.color;
    }
    return barColor;
  }

  private _computeSeverityColor(value: string, index: number): unknown {
    const config = this._configArray[index];
    const numberValue = Number(value);
    const sections = config.severity;
    let color: undefined | string;

    if (isNaN(numberValue)) {
      sections.forEach(section => {
        if (value == section.text) {
          color = section.color;
        }
      });
    } else {
      sections.forEach(section => {
        if (numberValue >= section.from && numberValue <= section.to) {
          color = section.color;
        }
      });
    }

    if (color == undefined) color = config.color;
    return color;
  }

  private _computeSeverityVisibility(value: string, index: number): boolean {
    const config = this._configArray[index];
    const numberValue = Number(value);
    const sections = config.severity;
    let hide = false;

    if (isNaN(numberValue)) {
      sections.forEach(section => {
        if (value == section.text) {
          hide = section.hide;
        }
      });
    } else {
      sections.forEach(section => {
        if (numberValue >= section.from && numberValue <= section.to) {
          hide = section.hide;
        }
      });
    }
    return hide;
  }

  private _computeSeverityIcon(value: string, index: number): string | boolean {
    const config = this._configArray[index];
    const numberValue = Number(value);
    const sections = config.severity;
    let icon = false;

    if (!sections) return false;

    if (isNaN(numberValue)) {
      sections.forEach(section => {
        if (value == section.text) {
          icon = section.icon;
        }
      });
    } else {
      sections.forEach(section => {
        if (numberValue >= section.from && numberValue <= section.to) {
          icon = section.icon;
        }
      });
    }
    return icon;
  }

  private _computePercent(value: string, index: number): number {
    const config = this._configArray[index];
    const numberValue = Number(value);

    if (value == 'unavailable') return 0;
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

  private _handleAction(ev): void {
    if (this.hass && ev.target.config && ev.detail.action) {
      handleAction(this, this.hass, ev.target.config, ev.detail.action);
    }
  }

  getCardSize(): number {
    if (this._config.height) {
      const heightString = this._config.height.toString();
      const cardSize = Math.trunc((Number(heightString.replace('px', '')) / 50) * this._rowAmount);
      return cardSize + 1;
    } else {
      return this._rowAmount + 1;
    }
  }
}
