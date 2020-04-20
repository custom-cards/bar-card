import { LitElement, html, customElement, property, TemplateResult, CSSResult, css, PropertyValues } from 'lit-element';
import {
  HomeAssistant,
  fireEvent,
  LovelaceCardEditor,
  ActionConfig,
  domainIcon,
  computeDomain,
} from 'custom-card-helpers';

import { BarCardConfig } from './types';
import { mergeDeep, createEditorConfigArray, arrayMove, hasConfigOrEntitiesChanged } from './helpers';

const positionOptions = ['inside', 'outside', 'off'];

@customElement('bar-card-editor')
export class BarCardEditor extends LitElement implements LovelaceCardEditor {
  @property() public hass?: HomeAssistant;
  @property() private _config?: BarCardConfig;
  @property() private _toggle?: boolean;
  private _configArray: BarCardConfig[] = [];
  private _entityOptionsArray: object[] = [];
  private _options: any;

  // protected shouldUpdate(changedProps: PropertyValues): boolean {
  //   return hasConfigOrEntitiesChanged(this, changedProps, false);
  // }

  public setConfig(config: BarCardConfig): void {
    this._config = { ...config };

    if (!config.entity && !config.entities) {
      this._config.entity = 'none';
    }
    if (this._config.entity) {
      if (this._config) {
        this._config.entities = [];
        this._config.entities.push({ entity: config.entity });
        delete this._config.entity;
      }
    }

    this._configArray = createEditorConfigArray(this._config);

    const barOptions = {
      icon: 'format-list-numbered',
      name: 'Bar',
      secondary: 'Bar settings.',
      show: false,
    };

    const valueOptions = {
      icon: 'numeric',
      name: 'Value',
      secondary: 'Value settings.',
      show: false,
    };

    const cardOptions = {
      icon: 'card-bulleted',
      name: 'Card',
      secondary: 'Card settings.',
      show: false,
    };

    const positionsOptions = {
      icon: 'arrow-expand-horizontal',
      name: 'Positions',
      secondary: 'Set positions of card elements.',
      show: false,
    };

    const entityOptions = {
      show: false,
      options: {
        positions: { ...positionsOptions },
        bar: { ...barOptions },
        value: { ...valueOptions },
        card: { ...positionsOptions },
      },
    };

    for (let i = 0; i < this._configArray.length; i++) {
      this._entityOptionsArray.push({ ...entityOptions });
    }
    if (!this._options) {
      this._options = {
        entities: {
          icon: 'tune',
          name: 'Entities',
          secondary: 'Manage card entities.',
          show: true,
          options: {
            entities: this._entityOptionsArray,
          },
        },
        appearance: {
          icon: 'palette',
          name: 'Appearance',
          secondary: 'Customize the global name, icon, etc.',
          show: false,
          options: {
            positions: positionsOptions,
            bar: barOptions,
            value: valueOptions,
            card: cardOptions,
          },
        },
      };
    }
  }

  get _name(): string {
    if (this._config) {
      return this._config.name || '';
    }

    return '';
  }

  get _entity(): string {
    if (this._config) {
      return this._config.entity || '';
    }

    return '';
  }

  get _entity_row(): boolean {
    if (this._config) {
      return this._config.entity_row || false;
    }

    return false;
  }

  get _columns(): number | boolean {
    if (this._config) {
      return this._config.columns || false;
    }

    return false;
  }

  get _direction(): string {
    if (this._config) {
      return this._config.direction || '';
    }

    return '';
  }

  get _height(): number | string {
    if (this._config) {
      return this._config.height || '';
    }

    return 40;
  }

  get _width(): string {
    if (this._config) {
      return this._config.width || '';
    }

    return '';
  }

  get _color(): string {
    if (this._config) {
      return this._config.color || '';
    }

    return '';
  }

  get _decimal(): number | boolean {
    if (this._config) {
      return this._config.decimal || false;
    }

    return false;
  }

  get _icon(): number | boolean {
    if (this._config) {
      return this._config.icon || false;
    }

    return false;
  }

  get _limit_value(): boolean {
    if (this._config) {
      return this._config.limit_value || false;
    }

    return false;
  }

  get _min(): number | boolean {
    if (this._config) {
      return this._config.min || false;
    }

    return false;
  }

  get _max(): number | boolean {
    if (this._config) {
      return this._config.max || false;
    }

    return false;
  }

  get _target(): number | boolean {
    if (this._config) {
      return this._config.target || false;
    }

    return false;
  }

  get _title(): string {
    if (this._config) {
      return this._config.title || '';
    }

    return '';
  }

  get _unit_of_measurement(): string {
    if (this._config) {
      return this._config.unit_of_measurement || '';
    }

    return '';
  }

  get _positions(): object {
    if (this._config) {
      return this._config.positions || {};
    }

    return {};
  }

  get _entities(): object | boolean {
    if (this._config) {
      return this._config.entities || false;
    }

    return false;
  }

  get _tap_action(): ActionConfig {
    if (this._config) {
      return this._config.tap_action || { action: 'more-info' };
    }

    return { action: 'more-info' };
  }

  get _hold_action(): ActionConfig {
    if (this._config) {
      return this._config.hold_action || { action: 'none' };
    }

    return { action: 'none' };
  }

  get _double_tap_action(): ActionConfig {
    if (this._config) {
      return this._config.double_tap_action || { action: 'none' };
    }

    return { action: 'none' };
  }

  protected render(): TemplateResult | void {
    // const actionsElement = html`
    //   <div class="sub-category">
    //     <div class="option" @click=${this._toggleThing} .option=${'actions'}>
    //       <div class="row">
    //         <ha-icon .icon=${`mdi:${options.actions.icon}`}></ha-icon>
    //         <div class="title">${options.actions.name}</div>
    //         <ha-icon
    //           .icon=${options.actions.show ? `mdi:chevron-up` : `mdi:chevron-down`}
    //           style="margin-left: auto;"
    //         ></ha-icon>
    //       </div>
    //       <div class="secondary">${options.actions.secondary}</div>
    //     </div>
    //     ${options.actions.show
    //       ? html`
    //           <div class="category">
    //             <div class="sub-category" @click=${this._toggleThing} .option=${'tap'}>
    //               <div class="row">
    //                 <ha-icon .icon=${`mdi:${options.actions.options.tap.icon}`}></ha-icon>
    //                 <div class="title">${options.actions.options.tap.name}</div>
    //               </div>
    //               <div class="secondary">${options.actions.options.tap.secondary}</div>
    //             </div>
    //             ${options.actions.options.tap.show
    //               ? html`
    //                   <div class="value">
    //                     <paper-item>Action Editors Coming Soon</paper-item>
    //                   </div>
    //                 `
    //               : ''}
    //             <div class="sub-category" @click=${this._toggleThing} .option=${'hold'}>
    //               <div class="row">
    //                 <ha-icon .icon=${`mdi:${options.actions.options.hold.icon}`}></ha-icon>
    //                 <div class="title">${options.actions.options.hold.name}</div>
    //               </div>
    //               <div class="secondary">${options.actions.options.hold.secondary}</div>
    //             </div>
    //             ${options.actions.options.hold.show
    //               ? html`
    //                   <div class="value">
    //                     <paper-item>Action Editors Coming Soon</paper-item>
    //                   </div>
    //                 `
    //               : ''}
    //             <div class="sub-category" @click=${this._toggleThing} .option=${'double_tap'}>
    //               <div class="row">
    //                 <ha-icon .icon=${`mdi:${options.actions.options.double_tap.icon}`}></ha-icon>
    //                 <div class="title">${options.actions.options.double_tap.name}</div>
    //               </div>
    //               <div class="secondary">${options.actions.options.double_tap.secondary}</div>
    //             </div>
    //             ${options.actions.options.double_tap.show
    //               ? html`
    //                   <div class="value">
    //                     <paper-item>Action Editors Coming Soon</paper-item>
    //                   </div>
    //                 `
    //               : ''}
    //           </div>
    //         `
    //       : ''}
    //   </div>
    // `;

    return html`
      ${this._computeEntitiesElement()} ${this._computeAppearanceElement()}
    `;
  }

  private _computeBarElement(index): TemplateResult {
    let options;
    let config;
    if (index !== null) {
      options = this._options.entities.options.entities[index].options.bar;
      config = this._configArray[index];
    } else {
      options = this._options.appearance.options.bar;
      config = this._config;
    }
    return html`
      <div class="category" id="bar">
        <div class="sub-category" @click=${this._toggleThing} .options=${options}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`} style="margin-left: auto;"></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${options.show
          ? html`
              <div class="value">
                ${index == null
                  ? html`
                      <paper-dropdown-menu
                        label="Direction"
                        @value-changed=${this._valueChanged}
                        .configValue=${'direction'}
                      >
                        <paper-icon-button icon="menu" slot="dropdown-trigger"></paper-icon-button>
                        <paper-listbox
                          slot="dropdown-content"
                          attr-for-selected="item-name"
                          fallback-selection="right"
                          selected="${config.direction}"
                        >
                          <paper-item item-name="right">right</paper-item>
                          <paper-item item-name="up">up</paper-item>
                        </paper-listbox>
                      </paper-dropdown-menu>
                      <paper-input
                        label="Icon"
                        .value="${config.icon ? config.icon : ''}"
                        editable
                        .configValue=${'icon'}
                        @value-changed=${this._valueChanged}
                      ></paper-input>
                      <paper-input
                        label="Height"
                        .value="${config.height ? config.height : ''}"
                        editable
                        .configValue=${'height'}
                        @value-changed=${this._valueChanged}
                      ></paper-input>
                      <paper-input
                        label="Width"
                        .value="${config.width ? config.width : ''}"
                        editable
                        .configValue=${'width'}
                        @value-changed=${this._valueChanged}
                      ></paper-input>
                      <paper-input
                        label="Color"
                        .value="${config.color ? config.color : ''}"
                        editable
                        .configValue=${'color'}
                        @value-changed=${this._valueChanged}
                      ></paper-input>
                    `
                  : html`
                      <paper-dropdown-menu
                        label="Direction"
                        @value-changed=${this._valueChanged}
                        .configValue=${'direction'}
                        .configArray=${'entities'}
                        .configIndex=${index}
                      >
                        <paper-icon-button icon="menu" slot="dropdown-trigger"></paper-icon-button>
                        <paper-listbox
                          slot="dropdown-content"
                          attr-for-selected="item-name"
                          fallback-selection="right"
                          selected="${config.direction}"
                        >
                          <paper-item item-name="right">right</paper-item>
                          <paper-item item-name="up">up</paper-item>
                        </paper-listbox>
                      </paper-dropdown-menu>
                      <paper-input
                        label="Name"
                        .value=${config.name ? config.name : ''}
                        .configValue=${'name'}
                        .configArray=${'entities'}
                        .configIndex=${index}
                        @value-changed=${this._valueChanged}
                      ></paper-input>
                      <paper-input
                        label="Icon"
                        .value="${config.icon ? config.icon : ''}"
                        editable
                        .configValue=${'icon'}
                        .configArray=${'entities'}
                        .configIndex=${index}
                        @value-changed=${this._valueChanged}
                      ></paper-input>
                      <paper-input
                        label="Height"
                        .value="${config.height ? config.height : ''}"
                        editable
                        .configValue=${'height'}
                        .configArray=${'entities'}
                        .configIndex=${index}
                        @value-changed=${this._valueChanged}
                      ></paper-input>
                      <paper-input
                        label="Width"
                        .value="${config.width ? config.width : ''}"
                        editable
                        .configValue=${'width'}
                        .configArray=${'entities'}
                        .configIndex=${index}
                        @value-changed=${this._valueChanged}
                      ></paper-input>
                      <paper-input
                        label="Color"
                        .value="${config.color ? config.color : ''}"
                        editable
                        .configValue=${'color'}
                        .configArray=${'entities'}
                        .configIndex=${index}
                        @value-changed=${this._valueChanged}
                      ></paper-input>
                    `}
              </div>
            `
          : ''}
      </div>
    `;
  }

  private _computeEntitiesElement(): TemplateResult {
    if (!this.hass) {
      return html``;
    }
    const entities = Object.keys(this.hass.states);
    const options = this._options.entities;

    return html`
      <div class="card-config">
        <div class="option" @click=${this._toggleThing} .options=${options} .configTarget=${this._options}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`} style="margin-left: auto;"></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${options.show
          ? html`
              <div class="card-background">
                ${this._configArray.length > 0
                  ? this._configArray.map(config => {
                      return html`
                        <div class="sub-category" style="display: flex; flex-direction: row; align-items: center;">
                          <ha-icon
                            icon=${this.hass!.states[config.entity]
                              ? domainIcon(computeDomain(config.entity), this.hass!.states[config.entity].state)
                              : 'mdi:alpha-b-box'}
                          ></ha-icon>
                          <div class="value" style="margin-left: 16px; flex-grow: 1;">
                            <paper-dropdown-menu
                              label="Entity"
                              @value-changed=${this._valueChanged}
                              .configValue=${'entity'}
                              .configArray=${'entities'}
                              .configIndex=${this._configArray.indexOf(config)}
                              style="width: 100%;"
                            >
                              <paper-listbox
                                slot="dropdown-content"
                                .selected=${entities.indexOf(config.entity)}
                                fallback-selection="0"
                              >
                                ${entities.map(entity => {
                                  return html`
                                    <paper-item>${entity}</paper-item>
                                  `;
                                })}
                              </paper-listbox>
                            </paper-dropdown-menu>
                          </div>
                          ${this._configArray.indexOf(config) !== 0
                            ? html`
                                <ha-icon
                                  class="ha-icon-large"
                                  icon="mdi:arrow-up"
                                  @click=${this._arrayMove}
                                  .configDirection=${'up'}
                                  .configValue=${'entity'}
                                  .configArray=${'entities'}
                                  .configIndex=${this._configArray.indexOf(config)}
                                ></ha-icon>
                              `
                            : html`
                                <ha-icon icon="mdi:arrow-up" style="opacity: 25%;" class="ha-icon-large"></ha-icon>
                              `}
                          ${this._configArray.indexOf(config) !== this._configArray.length - 1
                            ? html`
                                <ha-icon
                                  class="ha-icon-large"
                                  icon="mdi:arrow-down"
                                  @click=${this._arrayMove}
                                  .configDirection=${'down'}
                                  .configValue=${'entity'}
                                  .configArray=${'entities'}
                                  .configIndex=${this._configArray.indexOf(config)}
                                ></ha-icon>
                              `
                            : html`
                                <ha-icon icon="mdi:arrow-down" style="opacity: 25%;" class="ha-icon-large"></ha-icon>
                              `}
                          <ha-icon
                            class="ha-icon-large"
                            icon="mdi:close"
                            @click=${this._removeFromArray}
                            .configValue=${'entity'}
                            .configArray=${'entities'}
                            .configIndex=${this._configArray.indexOf(config)}
                          ></ha-icon>
                        </div>
                        <div class="options" style="margin-left: 40px;">
                          <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div
                              style="font-size: 11px; margin: 4px;"
                              @click=${this._toggleThing}
                              .options=${options.options.entities[this._configArray.indexOf(config)]}
                              .optionsTarget=${options.options.entities}
                              .index=${this._configArray.indexOf(config)}
                            >
                              options
                            </div>
                            <ha-icon
                              icon="mdi:chevron-${options.options.entities[this._configArray.indexOf(config)].show
                                ? 'down'
                                : 'up'}"
                              @click=${this._toggleThing}
                              .options=${options.options.entities[this._configArray.indexOf(config)]}
                              .optionsTarget=${options.options.entities}
                              .index=${this._configArray.indexOf(config)}
                            ></ha-icon>
                          </div>
                          ${options.options.entities[this._configArray.indexOf(config)].show
                            ? html`
                                <div class="options">
                                  ${this._computeBarElement(this._configArray.indexOf(config))}
                                </div>
                              `
                            : ''}
                        </div>
                      `;
                    })
                  : ''}
                <div class="sub-category" style="display: flex; flex-direction: column; align-items: flex-end;">
                  <ha-fab
                    icon="mdi:plus"
                    @click=${this._addToArray}
                    .configValue=${'entity'}
                    .configArray=${'entities'}
                  ></ha-fab>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private _computeAppearanceElement(): TemplateResult {
    if (!this.hass) {
      return html``;
    }
    const options = this._options.appearance;
    return html`
        <div class="option" @click=${this._toggleThing} .options=${options} .optionsTarget=${this._options}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon
              .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`}
              style="margin-left: auto;"
            ></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${
          options.show
            ? html`
                <div class="card-background">
                  ${this._computeBarElement(null)} ${this._computeCardElement()} ${this._computeValueElement()}
                  ${this._computePositionsElement(null)}
                </div>
              `
            : ''
        }
      </div>`;
  }

  private _computeCardElement(): TemplateResult {
    if (!this.hass) {
      return html``;
    }
    const options = this._options.appearance.options.card;
    return html`
      <div class="category" id="card">
        <div class="sub-category" @click=${this._toggleThing} .options=${options}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`} style="margin-left: auto;"></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${options.show
          ? html`
              <div class="value">
                <paper-input
                  label="Header Title"
                  .value="${this._title ? this._title : ''}"
                  editable
                  .configValue=${'title'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Columns"
                  .value=${this._columns ? this._columns : ''}
                  .configValue=${'columns'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <div>
                  ${this._entity_row
                    ? html`
                        <ha-switch
                          checked
                          .value=${this._entity_row}
                          .configValue=${'entity_row'}
                          @change=${this._valueChanged}
                          >Entity Row</ha-switch
                        >
                      `
                    : html`
                        <ha-switch
                          unchecked
                          .value=${this._entity_row}
                          .configValue=${'entity_row'}
                          @change=${this._valueChanged}
                          >Entity Row</ha-switch
                        >
                      `}
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private _computePositionsElement(index): TemplateResult {
    if (!this.hass) {
      return html``;
    }
    const defaultPositions = {
      icon: 'outside',
      indicator: 'outside',
      name: 'inside',
      minmax: 'off',
      value: 'inside',
    };
    let options;
    let config;
    if (index !== null) {
      options = this._options.entities.options.entities[index].options.positions;
      config = this._configArray[index];
    } else {
      options = this._options.appearance.options.positions;
      config = this._config;
    }
    config.positions = Object.assign(defaultPositions, config.positions);
    return html`
      <div class="category" id="positions">
        <div class="sub-category" @click=${this._toggleThing} .options=${options}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`} style="margin-left: auto;"></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${options.show
          ? html`
              <div>
                ${Object.keys(config.positions).map(position => {
                  return html`
                    <div class="value">
                      <paper-dropdown-menu
                        label="${position}"
                        @value-changed=${this._valueChanged}
                        .configValue=${position}
                        .configObject=${'positions'}
                      >
                        <paper-listbox
                          slot="dropdown-content"
                          .selected="${positionOptions.indexOf(config.positions[position])}"
                        >
                          <paper-item>inside</paper-item>
                          <paper-item>outside</paper-item>
                          <paper-item>off</paper-item>
                        </paper-listbox>
                      </paper-dropdown-menu>
                    </div>
                  `;
                })}
              </div>
            `
          : ``}
      </div>
    `;
  }

  private _computeValueElement(): TemplateResult {
    if (!this.hass) {
      return html``;
    }
    const options = this._options.appearance.options.value;
    return html`
      <div class="category" id="value">
        <div class="sub-category" @click=${this._toggleThing} .options=${options}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`} style="margin-left: auto;"></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${options.show
          ? html`
              <div class="value">
                ${this._limit_value
                  ? html`
                      <ha-switch
                        checked
                        .value=${this._limit_value}
                        .configValue=${'limit_value'}
                        @change=${this._valueChanged}
                        >Limit Value</ha-switch
                      >
                    `
                  : html`
                      <ha-switch
                        unchecked
                        .value=${this._limit_value}
                        .configValue=${'limit_value'}
                        @change=${this._valueChanged}
                        >Limit Value</ha-switch
                      >
                    `}
                <paper-input
                  label="Decimal"
                  .value="${this._decimal ? this._decimal : ''}"
                  editable
                  .configValue=${'decimal'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Min"
                  .value="${this._min ? this._min : ''}"
                  editable
                  .configValue=${'min'}
                  @value-changed=${this._valueChanged}
                  style="margin-right: 8px;"
                ></paper-input>
                <paper-input
                  label="Max"
                  .value="${this._max ? this._max : ''}"
                  editable
                  .configValue=${'max'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Target"
                  .value="${this._target ? this._target : ''}"
                  editable
                  .configValue=${'target'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Unit of Measurement"
                  .value="${this._unit_of_measurement ? this._unit_of_measurement : ''}"
                  editable
                  .configValue=${'unit_of_measurement'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private _toggleThing(ev): void {
    const options = ev.target.options;
    const show = !options.show;
    if (ev.target.optionsTarget) {
      if (Array.isArray(ev.target.optionsTarget)) {
        for (const options of ev.target.optionsTarget) {
          options.show = false;
        }
      } else {
        for (const [key] of Object.entries(ev.target.optionsTarget)) {
          ev.target.optionsTarget[key].show = false;
        }
      }
    }
    options.show = show;
    this._toggle = !this._toggle;
  }

  private _removeFromArray(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    const entitiesArray: BarCardConfig[] = [];
    let index = 0;
    for (const config of this._configArray) {
      if (target.configIndex !== index) {
        entitiesArray.push(config);
      }
      index++;
    }
    const newConfig = { [target.configArray]: entitiesArray };
    this._config = Object.assign(this._config, newConfig);
    fireEvent(this, 'config-changed', { config: this._config });
    this._toggle = !this._toggle;
    this._toggle = !this._toggle;
  }

  private _addToArray(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    const entitiesArray: BarCardConfig[] = [];
    let index = 0;
    for (const config of this._configArray) {
      if (target.configIndex !== index) {
        entitiesArray.push(config);
      }
      index++;
    }
    const newEntity: any = { entity: '' };
    entitiesArray.push(newEntity);

    const newConfig = { [target.configArray]: entitiesArray };
    this._config = Object.assign(this._config, newConfig);
    fireEvent(this, 'config-changed', { config: this._config });
    this._toggle = !this._toggle;
  }

  private _arrayMove(ev): void {
    const target = ev.target;
    const entitiesArray: BarCardConfig[] = [];
    for (const config of this._configArray) {
      entitiesArray.push(config);
    }

    if (target.configDirection == 'up') arrayMove(entitiesArray, target.configIndex, target.configIndex - 1);
    else if (target.configDirection == 'down') arrayMove(entitiesArray, target.configIndex, target.configIndex + 1);

    const newConfig = { [target.configArray]: entitiesArray };
    this._config = Object.assign(this._config, newConfig);
    fireEvent(this, 'config-changed', { config: this._config });
    this._toggle = !this._toggle;
  }

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    // if (this[`_${target.configValue}`] === target.value) {
    //   return;
    // }
    if (target.configValue) {
      if (target.configObject) {
        switch (typeof target.value) {
          case 'string':
            if (target.value === '') {
              delete this._config[target.configObject][target.configValue];
            } else {
              this._config = mergeDeep(this._config, {
                [target.configObject]: {
                  [target.configValue]: target.checked !== undefined ? target.checked : target.value,
                },
              });
            }
            break;
        }
      } else if (target.configArray) {
        switch (typeof target.value) {
          case 'string':
            for (const config of this._configArray) {
              const index = this._configArray.indexOf(config);
              if (target.configIndex == index) {
                if (target.value == '') {
                  delete config[target.configValue];
                } else {
                  config[target.configValue] = target.checked !== undefined ? target.checked : target.value;
                }
              }
            }
            this._config[target.configArray] = this._configArray;
            break;
        }
      } else {
        switch (typeof target.value) {
          case 'string':
            if (target.value === '') {
              delete this._config[target.configValue];
            } else {
              this._config = {
                ...this._config,
                [target.configValue]: target.checked !== undefined ? target.checked : target.value,
              };
            }
            break;
          case 'boolean':
            if (this._config[target.configValue] === true) {
              delete this._config[target.configValue];
            } else {
              this._config = {
                ...this._config,
                [target.configValue]: target.checked !== undefined ? target.checked : target.value,
              };
            }
            break;
          case 'number':
            if (target.value === '' || target.value === false) {
              delete this._config[target.configValue];
            } else {
              this._config = {
                ...this._config,
                [target.configValue]: Number(target.checked !== undefined ? target.checked : target.value),
              };
            }
            break;
        }
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles(): CSSResult {
    return css`
      .option {
        padding: 4px 0px;
        cursor: pointer;
      }
      .options {
        background: #0002;
        cursor: pointer;
      }
      .sub-category {
        padding: 4px 0px;
        cursor: pointer;
      }
      .row {
        display: flex;
        margin-bottom: -14px;
        pointer-events: none;
        margin-top: 14px;
      }
      .title {
        padding-left: 16px;
        margin-top: -6px;
        pointer-events: none;
      }
      .secondary {
        padding-left: 40px;
        color: var(--secondary-text-color);
        pointer-events: none;
      }
      .value {
        margin-left: 8px;
      }
      ha-switch {
        padding: 16px 0;
      }
      .card-background {
        background: var(--paper-card-background-color);
        border-radius: var(--ha-card-border-radius);
        padding: 16px;
      }
      .category {
        background: #0000;
      }
      .ha-icon-large {
        margin: 0px 4px;
      }
    `;
  }
}
// @ts-ignore
window.customCards = window.customCards || [];
// @ts-ignore
window.customCards.push({
  type: 'bar-card',
  name: 'Bar Card',
  preview: false, // Optional - defaults to false
  description: 'A customizable bar card.', // Optional
});
