import { LitElement, html, customElement, property, TemplateResult, CSSResult, css, PropertyValues } from 'lit-element';
import { HomeAssistant, fireEvent, LovelaceCardEditor, ActionConfig } from 'custom-card-helpers';

import { BarCardConfig } from './types';
import { createEditorConfigArray, arrayMove, hasConfigOrEntitiesChanged } from './helpers';

@customElement('bar-card-editor')
export class BarCardEditor extends LitElement implements LovelaceCardEditor {
  @property() public hass?: HomeAssistant;
  @property() private _config;
  @property() private _toggle?: boolean;
  private _configArray: any[] = [];
  private _entityOptionsArray: object[] = [];
  private _options: any;

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntitiesChanged(this, changedProps, true);
  }

  public setConfig(config: BarCardConfig): void {
    this._config = { ...config };

    if (!config.entity && !config.entities) {
      this._config.entity = 'none';
    }
    if (this._config.entity) {
      this._configArray.push({ entity: config.entity });
      this._config.entities = [{ entity: config.entity }];
      delete this._config.entity;
    }

    this._configArray = createEditorConfigArray(this._config);

    if (this._config.animation) {
      if (Object.entries(this._config.animation).length === 0) {
        delete this._config.animation;
        fireEvent(this, 'config-changed', { config: this._config });
      }
    }
    if (this._config.positions) {
      if (Object.entries(this._config.positions).length === 0) {
        delete this._config.positions;
        fireEvent(this, 'config-changed', { config: this._config });
      }
    }

    for (const entityConfig of this._configArray) {
      if (entityConfig.animation) {
        if (Object.entries(entityConfig.animation).length === 0) {
          delete entityConfig.animation;
        }
      }
      if (entityConfig.positions) {
        if (Object.entries(entityConfig.positions).length === 0) {
          delete entityConfig.positions;
        }
      }
    }
    this._config.entities = this._configArray;
    fireEvent(this, 'config-changed', { config: this._config });

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

    const actionsOptions = {
      icon: 'gesture-tap',
      name: 'Actions',
      secondary: 'Coming soon... Use code editor for Actions.',
      show: false,
    };

    const severityOptions = {
      icon: 'exclamation-thick',
      name: 'Severity',
      secondary: 'Define bar colors based on value.',
      show: false,
    };

    const animationOptions = {
      icon: 'animation',
      name: 'Animation',
      secondary: 'Define animation settings.',
      show: false,
    };

    const entityOptions = {
      show: false,
      options: {
        positions: { ...positionsOptions },
        bar: { ...barOptions },
        value: { ...valueOptions },
        severity: { ...severityOptions },
        actions: { ...actionsOptions },
        animation: { ...animationOptions },
      },
    };

    for (const config of this._configArray) {
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
            severity: severityOptions,
            animation: animationOptions,
          },
        },
      };
    }
  }

  protected render(): TemplateResult | void {
    return html`
      ${this._createEntitiesElement()} ${this._createAppearanceElement()}
    `;
  }

  private _createActionsElement(index): TemplateResult {
    const options = this._options.entities.options.entities[index].options.actions;
    return html`
      <div class="sub-category" style="opacity: 0.5;">
        <div>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
      </div>
    `;
  }

  private _createEntitiesValues(): TemplateResult[] {
    if (!this.hass || !this._config) {
      return [html``];
    }

    const options = this._options.entities;
    const entities = Object.keys(this.hass.states);
    const valueElementArray: TemplateResult[] = [];
    for (const config of this._configArray) {
      const index = this._configArray.indexOf(config);
      valueElementArray.push(html`
        <div class="sub-category" style="display: flex; flex-direction: row; align-items: center;">
          <div style="display: flex; align-items: center; flex-direction: column;">
            <div
              style="font-size: 10px; margin-bottom: -8px; opacity: 0.5;"
              @click=${this._toggleThing}
              .options=${options.options.entities[index]}
              .optionsTarget=${options.options.entities}
              .index=${index}
            >
              options
            </div>
            <ha-icon
              icon="mdi:chevron-${options.options.entities[index].show ? 'up' : 'down'}"
              @click=${this._toggleThing}
              .options=${options.options.entities[index]}
              .optionsTarget=${options.options.entities}
              .index=${index}
            ></ha-icon>
          </div>
          <div class="value" style="flex-grow: 1;">
            <paper-input
              label="Entity"
              @value-changed=${this._valueChanged}
              .configAttribute=${'entity'}
              .configObject=${this._configArray[index]}
              .value=${config.entity}
            >
            </paper-input>
          </div>
          ${index !== 0
            ? html`
                <ha-icon
                  class="ha-icon-large"
                  icon="mdi:arrow-up"
                  @click=${this._moveEntity}
                  .configDirection=${'up'}
                  .configArray=${this._config!.entities}
                  .arrayAttribute=${'entities'}
                  .arraySource=${this._config}
                  .index=${index}
                ></ha-icon>
              `
            : html`
                <ha-icon icon="mdi:arrow-up" style="opacity: 25%;" class="ha-icon-large"></ha-icon>
              `}
          ${index !== this._configArray.length - 1
            ? html`
                <ha-icon
                  class="ha-icon-large"
                  icon="mdi:arrow-down"
                  @click=${this._moveEntity}
                  .configDirection=${'down'}
                  .configArray=${this._config!.entities}
                  .arrayAttribute=${'entities'}
                  .arraySource=${this._config}
                  .index=${index}
                ></ha-icon>
              `
            : html`
                <ha-icon icon="mdi:arrow-down" style="opacity: 25%;" class="ha-icon-large"></ha-icon>
              `}
          <ha-icon
            class="ha-icon-large"
            icon="mdi:close"
            @click=${this._removeEntity}
            .configAttribute=${'entity'}
            .configArray=${'entities'}
            .configIndex=${index}
          ></ha-icon>
        </div>
        ${options.options.entities[index].show
          ? html`
              <div class="options">
                ${this._createBarElement(index)} ${this._createValueElement(index)}
                ${this._createPositionsElement(index)} ${this._createSeverityElement(index)}
                ${this._createAnimationElement(index)} ${this._createActionsElement(index)}
              </div>
            `
          : ''}
      `);
    }
    return valueElementArray;
  }

  private _createEntitiesElement(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }
    const options = this._options.entities;

    return html`
      <div class="card-config">
        <div class="option" @click=${this._toggleThing} .options=${options} .optionsTarget=${this._options}>
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`} style="margin-left: auto;"></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${options.show
          ? html`
              <div class="card-background" style="max-height: 400px; overflow: auto;">
                ${this._createEntitiesValues()}
                <div class="sub-category" style="display: flex; flex-direction: column; align-items: flex-end;">
                  <ha-fab
                    mini
                    icon="mdi:plus"
                    @click=${this._addEntity}
                    .configArray=${this._configArray}
                    .configAddValue=${'entity'}
                    .sourceArray=${this._config.entities}
                  ></ha-fab>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private _createAppearanceElement(): TemplateResult {
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
                  ${this._createCardElement()} ${this._createBarElement(null)} ${this._createValueElement(null)}
                  ${this._createPositionsElement(null)} ${this._createSeverityElement(null)}
                  ${this._createAnimationElement(null)}
                </div>
              `
            : ''
        }
      </div>`;
  }

  private _createBarElement(index): TemplateResult {
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
        <div
          class="sub-category"
          @click=${this._toggleThing}
          .options=${options}
          .optionsTarget=${this._options.appearance.options}
        >
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
                <div>
                  <paper-dropdown-menu
                    label="Direction"
                    @selected-item-changed=${this._valueChanged}
                    .configObject=${config}
                    .configAttribute=${'direction'}
                    .ignoreNull=${true}
                  >
                    <paper-listbox
                      slot="dropdown-content"
                      attr-for-selected="item-name"
                      selected="${config.direction ? config.direction : null}"
                    >
                      <paper-item item-name="right">right</paper-item>
                      <paper-item item-name="up">up</paper-item>
                    </paper-listbox>
                  </paper-dropdown-menu>
                  ${config.direction
                    ? html`
                        <ha-icon
                          class="ha-icon-large"
                          icon="mdi:close"
                          @click=${this._valueChanged}
                          .value=${''}
                          .configAttribute=${'direction'}
                          .configObject=${config}
                        ></ha-icon>
                      `
                    : ''}
                </div>
                ${index !== null
                  ? html`
                      <paper-input
                        label="Name"
                        .value="${config.name ? config.name : ''}"
                        editable
                        .configAttribute=${'name'}
                        .configObject=${config}
                        @value-changed=${this._valueChanged}
                      ></paper-input>
                    `
                  : ''}
                <paper-input
                  label="Icon"
                  .value="${config.icon ? config.icon : ''}"
                  editable
                  .configAttribute=${'icon'}
                  .configObject=${config}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Height"
                  .value="${config.height ? config.height : ''}"
                  editable
                  .configAttribute=${'height'}
                  .configObject=${config}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Width"
                  .value="${config.width ? config.width : ''}"
                  editable
                  .configAttribute=${'width'}
                  .configObject=${config}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Color"
                  .value="${config.color ? config.color : ''}"
                  editable
                  .configAttribute=${'color'}
                  .configObject=${config}
                  @value-changed=${this._valueChanged}
                ></paper-input>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private _createAnimationElement(index): TemplateResult {
    let options;
    let config;
    if (index !== null) {
      options = this._options.entities.options.entities[index].options.animation;
      config = this._configArray[index];
    } else {
      options = this._options.appearance.options.animation;
      config = this._config;
    }
    config.animation = { ...config.animation };
    return html`
      <div class="category" id="bar">
        <div
          class="sub-category"
          @click=${this._toggleThing}
          .options=${options}
          .optionsTarget=${this._options.appearance.options}
        >
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`} style="margin-left: auto;"></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${options.show
          ? config.animation
            ? html`
                <div class="value">
                  <div>
                    <paper-dropdown-menu
                      label="State"
                      @selected-item-changed=${this._valueChanged}
                      .configAttribute=${'state'}
                      .configObject=${config.animation}
                      .index=${index}
                      .ignoreNull=${true}
                    >
                      <paper-listbox
                        slot="dropdown-content"
                        attr-for-selected="item-name"
                        selected="${config.animation.state ? config.animation.state : null}"
                      >
                        <paper-item item-name="on">on</paper-item>
                        <paper-item item-name="off">off</paper-item>
                      </paper-listbox>
                    </paper-dropdown-menu>
                    ${config.animation.state
                      ? html`
                          <ha-icon
                            class="ha-icon-large"
                            icon="mdi:close"
                            @click=${this._valueChanged}
                            .value=${''}
                            .configAttribute=${'state'}
                            .configObject=${config.animation}
                            .index=${index}
                          ></ha-icon>
                        `
                      : ''}
                  </div>
                  <paper-input
                    label="Speed"
                    .value="${config.animation.speed ? config.animation.speed : ''}"
                    editable
                    @value-changed=${this._valueChanged}
                    .configAttribute=${'speed'}
                    .configObject=${config.animation}
                    .index=${index}
                  ></paper-input>
                </div>
              `
            : html`
                <div class="value">
                  <div>
                    <paper-dropdown-menu
                      label="State"
                      @selected-item-changed=${this._valueChanged}
                      .configObject=${config}
                      .configAttribute=${'state'}
                      .configAdd=${'animation'}
                      .index=${index}
                      .ignoreNull=${true}
                    >
                      <paper-listbox slot="dropdown-content" attr-for-selected="item-name">
                        <paper-item item-name="on">on</paper-item>
                        <paper-item item-name="off">off</paper-item>
                      </paper-listbox>
                    </paper-dropdown-menu>
                  </div>
                  <paper-input
                    label="Speed"
                    editable
                    .value=${''}
                    @value-changed=${this._valueChanged}
                    .configAttribute=${'speed'}
                    .configObject=${config}
                    .configAdd=${'animation'}
                    .index=${index}
                  ></paper-input>
                </div>
              `
          : ''}
      </div>
    `;
  }

  private _createSeverityElement(index): TemplateResult {
    let options;
    let config;
    if (index !== null) {
      options = this._options.entities.options.entities[index].options.severity;
      config = this._configArray[index];
    } else {
      options = this._options.appearance.options.severity;
      config = this._config;
    }
    const arrayLength = config.severity ? config.severity.length : 0;
    return html`
      <div class="category" id="bar">
        <div
          class="sub-category"
          @click=${this._toggleThing}
          .options=${options}
          .optionsTarget=${this._options.appearance.options}
        >
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`} style="margin-left: auto;"></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${options.show
          ? html`
              <div class="card-background" style="overflow: auto; max-height: 420px;">
                ${arrayLength > 0
                  ? html`
                      ${this._createSeverityValues(index)}
                    `
                  : ''}
                <div class="sub-category" style="display: flex; flex-direction: column; align-items: flex-end;">
                  <ha-fab mini icon="mdi:plus" @click=${this._addSeverity} .index=${index}></ha-fab>
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private _createSeverityValues(index): TemplateResult[] {
    let config;
    if (index === null) {
      config = this._config;
    } else {
      config = this._configArray[index];
    }
    const severityValuesArray: TemplateResult[] = [];
    for (const severity of config.severity) {
      const severityIndex = config.severity.indexOf(severity);
      severityValuesArray.push(html`
        <div class="sub-category" style="display: flex; flex-direction: row; align-items: center;">
          <div class="value">
            <div style="display:flex;">
              <paper-input
                label="From"
                type="number"
                .value="${severity.from || severity.from === 0 ? severity.from : ''}"
                editable
                .severityAttribute=${'from'}
                .index=${index}
                .severityIndex=${severityIndex}
                @value-changed=${this._updateSeverity}
              ></paper-input>
              <paper-input
                label="To"
                type="number"
                .value="${severity.to ? severity.to : ''}"
                editable
                .severityAttribute=${'to'}
                .index=${index}
                .severityIndex=${severityIndex}
                @value-changed=${this._updateSeverity}
              ></paper-input>
            </div>
            <div style="display:flex;">
              <paper-input
                label="Color"
                .value="${severity.color ? severity.color : ''}"
                editable
                .severityAttribute=${'color'}
                .index=${index}
                .severityIndex=${severityIndex}
                @value-changed=${this._updateSeverity}
              ></paper-input>
              <paper-input
                label="Icon"
                .value="${severity.icon ? severity.icon : ''}"
                editable
                .severityAttribute=${'icon'}
                .index=${index}
                .severityIndex=${severityIndex}
                @value-changed=${this._updateSeverity}
              ></paper-input>
            </div>
            ${severity.hide
              ? html`
                  <ha-switch
                    checked
                    .severityAttribute=${'hide'}
                    .index=${index}
                    .severityIndex=${severityIndex}
                    .value=${!severity.hide}
                    @change=${this._updateSeverity}
                    >Hide</ha-switch
                  >
                `
              : html`
                  <ha-switch
                    unchecked
                    .severityAttribute=${'hide'}
                    .index=${index}
                    .severityIndex=${severityIndex}
                    .value=${!severity.hide}
                    @change=${this._updateSeverity}
                    >Hide</ha-switch
                  >
                `}
          </div>
          <div style="display: flex;">
            ${severityIndex !== 0
              ? html`
                  <ha-icon
                    class="ha-icon-large"
                    icon="mdi:arrow-up"
                    @click=${this._moveSeverity}
                    .configDirection=${'up'}
                    .index=${index}
                    .severityIndex=${severityIndex}
                  ></ha-icon>
                `
              : html`
                  <ha-icon icon="mdi:arrow-up" style="opacity: 25%;" class="ha-icon-large"></ha-icon>
                `}
            ${severityIndex !== config.severity.length - 1
              ? html`
                  <ha-icon
                    class="ha-icon-large"
                    icon="mdi:arrow-down"
                    @click=${this._moveSeverity}
                    .configDirection=${'down'}
                    .index=${index}
                    .severityIndex=${severityIndex}
                  ></ha-icon>
                `
              : html`
                  <ha-icon icon="mdi:arrow-down" style="opacity: 25%;" class="ha-icon-large"></ha-icon>
                `}
            <ha-icon
              class="ha-icon-large"
              icon="mdi:close"
              @click=${this._removeSeverity}
              .index=${index}
              .severityIndex=${severityIndex}
            ></ha-icon>
          </div>
        </div>
      `);
    }
    return severityValuesArray;
  }

  private _createCardElement(): TemplateResult {
    if (!this.hass) {
      return html``;
    }
    const config: any = this._config;
    const index = null;
    const options = this._options.appearance.options.card;
    return html`
      <div class="category" id="card">
        <div
          class="sub-category"
          @click=${this._toggleThing}
          .options=${options}
          .optionsTarget=${this._options.appearance.options}
        >
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`} style="margin-left: auto;"></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${options.show
          ? html`
              <div class="value-container">
                <paper-input
                  editable
                  label="Header Title"
                  .value="${config.title ? config.title : ''}"
                  .configObject=${config}
                  .configAttribute=${'title'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  class="value-number"
                  type="number"
                  label="Columns"
                  .value=${config.columns ? config.columns : ''}
                  .configObject=${config}
                  .configAttribute=${'columns'}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <div>
                  ${config.entity_row
                    ? html`
                        <ha-switch
                          checked
                          .configAttribute=${'entity_row'}
                          .configObject=${config}
                          .value=${!config.entity_row}
                          @change=${this._valueChanged}
                          >Entity Row</ha-switch
                        >
                      `
                    : html`
                        <ha-switch
                          unchecked
                          .configAttribute=${'entity_row'}
                          .configObject=${config}
                          .value=${!config.entity_row}
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

  private _createPositionsValues(index): TemplateResult[] {
    const defaultPositions = {
      icon: 'outside',
      indicator: 'outside',
      name: 'inside',
      minmax: 'off',
      value: 'inside',
    };
    let config;
    if (index === null) {
      config = this._config;
    } else {
      config = this._configArray[index];
    }
    config.positions = { ...config.positions };
    const positionElementsArray: TemplateResult[] = [];
    const objectKeys = Object.keys(defaultPositions);
    for (const position of objectKeys) {
      if (config.positions[position]) {
        positionElementsArray.push(html`
          <div class="value">
            <paper-dropdown-menu
              label="${position}"
              @value-changed=${this._valueChanged}
              .configAttribute=${position}
              .configObject=${config.positions}
              .ignoreNull=${true}
            >
              <paper-listbox
                slot="dropdown-content"
                attr-for-selected="item-name"
                .selected=${config.positions[position]}
              >
                <paper-item item-name="inside">inside</paper-item>
                <paper-item item-name="outside">outside</paper-item>
                <paper-item item-name="off">off</paper-item>
              </paper-listbox>
            </paper-dropdown-menu>
            <ha-icon
              class="ha-icon-large"
              icon="mdi:close"
              @click=${this._valueChanged}
              .value=${''}
              .configAttribute=${position}
              .configObject=${config.positions}
            ></ha-icon>
          </div>
        `);
      } else {
        positionElementsArray.push(html`
          <div class="value">
            <paper-dropdown-menu
              label="${position}"
              @value-changed=${this._valueChanged}
              .configAttribute=${position}
              .configObject=${config.positions}
            >
              <paper-listbox slot="dropdown-content" .selected=${null}>
                <paper-item>inside</paper-item>
                <paper-item>outside</paper-item>
                <paper-item>off</paper-item>
              </paper-listbox>
            </paper-dropdown-menu>
          </div>
        `);
      }
    }
    return positionElementsArray;
  }

  private _createPositionsElement(index): TemplateResult {
    if (!this.hass) {
      return html``;
    }

    let options;
    let config;
    if (index === null) {
      options = this._options.appearance.options.positions;
      config = this._config;
    } else {
      options = this._options.entities.options.entities[index].options.positions;
      config = this._configArray[index];
    }
    return html`
      <div class="category">
        <div
          class="sub-category"
          @click=${this._toggleThing}
          .options=${options}
          .optionsTarget=${this._options.appearance.options}
        >
          <div class="row">
            <ha-icon .icon=${`mdi:${options.icon}`}></ha-icon>
            <div class="title">${options.name}</div>
            <ha-icon .icon=${options.show ? `mdi:chevron-up` : `mdi:chevron-down`} style="margin-left: auto;"></ha-icon>
          </div>
          <div class="secondary">${options.secondary}</div>
        </div>
        ${options.show
          ? html`
              ${this._createPositionsValues(index)}
            `
          : ``}
      </div>
    `;
  }

  private _createValueElement(index): TemplateResult {
    if (!this.hass) {
      return html``;
    }

    let options;
    let config;
    if (index !== null) {
      options = this._options.entities.options.entities[index].options.value;
      config = this._configArray[index];
    } else {
      options = this._options.appearance.options.value;
      config = this._config;
    }

    return html`
      <div class="category" id="value">
        <div
          class="sub-category"
          @click=${this._toggleThing}
          .options=${options}
          .optionsTarget=${this._options.appearance.options}
        >
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
                ${config.limit_value
                  ? html`
                      <ha-switch
                        checked
                        .configAttribute=${'limit_value'}
                        .configObject=${config}
                        .value=${!config.limit_value}
                        @change=${this._valueChanged}
                        >Limit Value</ha-switch
                      >
                    `
                  : html`
                      <ha-switch
                        unchecked
                        .configObject=${config}
                        .configAttribute=${'limit_value'}
                        .value=${!config.limit_value}
                        @change=${this._valueChanged}
                        >Limit Value</ha-switch
                      >
                    `}
                ${config.complementary
                  ? html`
                      <ha-switch
                        checked
                        .configAttribute=${'complementary'}
                        .configObject=${config}
                        .value=${!config.complementary}
                        @change=${this._valueChanged}
                        >Complementary</ha-switch
                      >
                    `
                  : html`
                      <ha-switch
                        unchecked
                        .configObject=${config}
                        .configAttribute=${'complementary'}
                        .value=${!config.complementary}
                        @change=${this._valueChanged}
                        >Complementary</ha-switch
                      >
                    `}
                <paper-input
                  class="value-number"
                  label="Decimal"
                  type="number"
                  .value="${config.decimal ? config.decimal : ''}"
                  editable
                  .configAttribute=${'decimal'}
                  .configObject=${config}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  class="value-number"
                  type="number"
                  label="Min"
                  .value="${config.min ? config.min : ''}"
                  editable
                  .configAttribute=${'min'}
                  .configObject=${config}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  class="value-number"
                  type="number"
                  label="Max"
                  .value="${config.max ? config.max : ''}"
                  editable
                  .configAttribute=${'max'}
                  .configObject=${config}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  class="value-number"
                  type="number"
                  label="Target"
                  .value="${config.target ? config.target : ''}"
                  editable
                  .configAttribute=${'target'}
                  .configObject=${config}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Unit of Measurement"
                  .value="${config.unit_of_measurement ? config.unit_of_measurement : ''}"
                  editable
                  .configAttribute=${'unit_of_measurement'}
                  .configObject=${config}
                  @value-changed=${this._valueChanged}
                ></paper-input>
                <paper-input
                  label="Attribute"
                  .value="${config.attribute ? config.attribute : ''}"
                  editable
                  .configAttribute=${'attribute'}
                  .configObject=${config}
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

  private _addEntity(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    let newObject;
    if (target.configAddObject) {
      newObject = target.configAddObject;
    } else {
      newObject = { [target.configAddValue]: '' };
    }
    const newArray = target.configArray.slice();
    newArray.push(newObject);
    this._config.entities = newArray;
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _moveEntity(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    let newArray = target.configArray.slice();
    if (target.configDirection == 'up') newArray = arrayMove(newArray, target.index, target.index - 1);
    else if (target.configDirection == 'down') newArray = arrayMove(newArray, target.index, target.index + 1);
    this._config.entities = newArray;
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _removeEntity(ev): void {
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
  }

  private _addSeverity(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;

    let severityArray;
    if (target.index === null) {
      severityArray = this._config.severity;
    } else {
      severityArray = this._config.entities[target.index].severity;
    }

    if (!severityArray) {
      severityArray = [];
    }

    const newObject = { from: '', to: '', color: '' };
    const newArray = severityArray.slice();
    newArray.push(newObject);

    if (target.index === null) {
      this._config.severity = newArray;
    } else {
      this._configArray[target.index].severity = newArray;
    }
    this._config.entities = this._configArray;
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _moveSeverity(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;

    let severityArray;
    if (target.index === null) {
      severityArray = this._config.severity;
    } else {
      severityArray = this._config.entities[target.index].severity;
    }

    let newArray = severityArray.slice();
    if (target.configDirection == 'up') {
      newArray = arrayMove(newArray, target.severityIndex, target.severityIndex - 1);
    } else if (target.configDirection == 'down') {
      newArray = arrayMove(newArray, target.severityIndex, target.severityIndex + 1);
    }

    if (target.index === null) {
      this._config.severity = newArray;
    } else {
      this._configArray[target.index].severity = newArray;
    }
    this._config.entities = this._configArray;
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _removeSeverity(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;

    let severityArray;
    if (target.index === null) {
      severityArray = this._config.severity;
    } else {
      severityArray = this._configArray[target.index].severity;
    }

    const clonedArray = severityArray.slice();
    const newArray: any = [];
    let arrayIndex = 0;
    for (const config of clonedArray) {
      if (target.severityIndex !== arrayIndex) {
        newArray.push(clonedArray[arrayIndex]);
      }
      arrayIndex++;
    }
    if (target.index === null) {
      if (newArray.length === 0) {
        delete this._config.severity;
      } else {
        this._config.severity = newArray;
      }
    } else {
      if (newArray.length === 0) {
        delete this._configArray[target.index].severity;
      } else {
        this._configArray[target.index].severity = newArray;
      }
    }
    this._config.entities = this._configArray;
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _updateSeverity(ev): void {
    const target = ev.target;

    let severityArray;
    if (target.index === null) {
      severityArray = this._config.severity;
    } else {
      severityArray = this._configArray[target.index].severity;
    }
    const newSeverityArray: any = [];
    for (const index in severityArray) {
      if (target.severityIndex == index) {
        const clonedObject = { ...severityArray[index] };
        const newObject = { [target.severityAttribute]: target.value };
        const mergedObject = Object.assign(clonedObject, newObject);
        if (target.value == '') {
          delete mergedObject[target.severityAttribute];
        }
        newSeverityArray.push(mergedObject);
      } else {
        newSeverityArray.push(severityArray[index]);
      }
    }

    if (target.index === null) {
      this._config.severity = newSeverityArray;
    } else {
      this._configArray[target.index].severity = newSeverityArray;
    }
    this._config.entities = this._configArray;
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (target.configObject[target.configAttribute] == target.value) {
      return;
    }

    if (target.configAdd && target.value !== '') {
      target.configObject = Object.assign(target.configObject, {
        [target.configAdd]: { [target.configAttribute]: target.value },
      });
    }
    if (target.configAttribute && target.configObject && !target.configAdd) {
      if (target.value == '' || target.value === false) {
        if (target.ignoreNull == true) return;
        delete target.configObject[target.configAttribute];
      } else {
        console.log(target.configObject);
        target.configObject[target.configAttribute] = target.value;
      }
    }
    this._config.entities = this._configArray;
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles(): CSSResult {
    return css`
      .option {
        padding: 4px 0px;
        cursor: pointer;
      }
      .options {
        background: var(--primary-background-color);
        border-radius: var(--ha-card-border-radius);
        cursor: pointer;
        padding: 8px;
      }
      .sub-category {
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
        padding: 0px 8px;
      }
      .value-container {
        padding: 0px 8px;
        transition: all 0.5s ease-in-out;
      }
      .value-container:target {
        height: 50px;
      }
      .value-number {
        width: 100px;
      }
      ha-fab {
        margin: 8px;
      }
      ha-switch {
        padding: 16px 0;
      }
      .card-background {
        background: var(--paper-card-background-color);
        border-radius: var(--ha-card-border-radius);
        padding: 8px;
      }
      .category {
        background: #0000;
      }
      .ha-icon-large {
        cursor: pointer;
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
