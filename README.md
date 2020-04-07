# bar-card
### [Examples](#examples-1)

![](https://github.com/custom-cards/bar-card/blob/master/images/default.gif?raw=true)

![](https://github.com/custom-cards/bar-card/blob/master/images/severity.gif?raw=true)

![](https://github.com/custom-cards/bar-card/blob/master/images/entity_row.gif?raw=true)

![](https://github.com/custom-cards/bar-card/blob/master/images/direction.gif?raw=true)

![](https://github.com/custom-cards/bar-card/blob/master/images/old_layout.gif?raw=true)

![](https://github.com/custom-cards/bar-card/blob/master/images/customcss.gif?raw=true)

## Description

Bar Card is a customizable animated card for the Home Assistant Lovelace front-end.

## Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:bar-card`
| entity | string | **Required** | Entity State
| animation | object | none | Defines animation options. See [Animation Options](#animation-options).
| attribute | string | none | Sets to card to display a specific attribute instead of state value.
| color | string | var(--custom-bar-card-color, var(--primary-color)) | Color of the bar, can be any valid CSS color value or variable. Custom themes should set `custom-bar-card-color` if `primary-color` is not a good default
| decimal | number | false | The amount of decimals to be displayed for the value. Shows full number when set to `false`.
| direction | string | right | Direction of the bar. `left`, `right`, `up`, `down`, `left-reverse`, `right-reverse`, `up-reverse`, `down-reverse`
| entities | array | none | A list of entities. Accepts individual config options per defined entity.
| entity_config | boolean | false | Sets the card to use the configured entity attributes as the card config.
| entity_row | boolean | false | Removes the background card for use inside entities card.
| height | string | 40px | Scales the height of the bar.
| icon | string | icon | Icon to be displayed. If no icon is defined entity icon attribute will be used. 
| limit_value | boolean | false | Displayed value is always within the minimum and maximum when set to `true`.
| max | number | 100 | The maximum entity value to be displayed, accepts entity id or attribute object value.
| min | number | 0 | The minimum entity value to be displayed, accepts entity id or attribute object value.
| name | string | none | Sets the name of the bar title.
| positions | object | none | Defines the positions of the card elements. See [Positions Options](#positions-options).
| service_options | object | none | A list of service call options. Should include `domain`, `service`, `data`
| severity | object | none | A list of severity values. See [Severity Options](#severity-options).
| stack | string | vertical | Sets the card to stack entities `veritcal` or `horizontal`.
| tap_action | string | info | Sets the action when tapping the bar. `info`, `service`
| target | number | none | Target marker value, accepts entity id or attribute object value.
| title | string | friendly_name | Adds title header to the card.
| unit_of_measurement | string | none | Unit of measurement to be displayed.
| width | string | 70% | Scales the width of the bar.

## Severity Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| from | number | **Required** | Defines from which value the color should be displayed.
| to | number | **Required** | Defines to which value the color should be displayed.
| color | array | **Required** | Defines the color to be displayed.

## Animation Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| state | string | off | Defines from which value the color should be displayed. `on`, `off`
| speed | number | 1000 | Defines the speed of the bar animation in milliseconds.
| delay | number | 5000 | Defines the amout of time between the bar animation loop in milliseconds.

## Positions Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| icon | string | outside | `inside`, `outside`, `off`
| indicator | string | outside | `inside`, `outside`, `off`
| title | string | inside | `inside`, `outside`, `off`
| minmax | string | off | `inside`, `outside`, `off`
| value | string | inside | `inside`, `outside`, `off`

## Theme Variables

| Name | Description
| ---- | ----
| bar-card-color | Defines the default bar color.
| bar-card-border-radius | Defines the border radius of the bar.
| bar-card-disabled-color | Defines the bar color when state is `unavailable`.

## CSS Elements

See [example](#200-default-layout-using-card-mod).

| Name | Description
| ---- | ----
| bar-card-card | The root bar of each defined entity containing all elements.
| bar-card-background | Contains bar and any elements `outside` of the bar.
| bar-card-backgroundbar | The background of the bar.
| bar-card-current | The filled part of the bar.
| bar-card-contentbar | Contains all elements `inside` of the bar.
| ha-icon | Icon element.
| bar-card-iconbar | Contains ha-icon.
| bar-card-title | Title element.
| bar-card-minvalue | Min value element.
| bar-card-divider | Min/Max divider element.
| bar-card-maxvalue | Max value element.
| bar-card-value | Value element.
| bar-card-animationbar | Animated part of the bar.
| bar-card-targetbar | Target bar element.
| bar-card-targetmarker | Target marker element.
| bar-card-indicator | Indicator element.


## Installation

Prefered method of installation is [Home Assistant Community Store](https://github.com/hacs/integration).

## Examples

### Default
![](https://github.com/custom-cards/bar-card/blob/master/images/default.gif?raw=true)

```yaml
entity: sensor.example
title: Default
type: 'custom:bar-card'
```

### Severity
![](https://github.com/custom-cards/bar-card/blob/master/images/severity.gif?raw=true)
```yaml
entity: sensor.example
title: Severity
type: 'custom:bar-card'
severity:
  - color: Red
    from: 0
    to: 25
  - color: Orange
    from: 26
    to: 50
  - color: Green
    from: 51
    to: 100
```

### Entity Row
![](https://github.com/custom-cards/bar-card/blob/master/images/entity_row.gif?raw=true)
```yaml
entities:
  - sensor.example
  - entity: sensor.example
    positions:
      minmax: inside
    entity_row: true
    target: 50
    type: 'custom:bar-card'
  - entity: light.group_bedroom
    name: Example
title: Entity Row
type: entities
```

### Direction
![](https://github.com/custom-cards/bar-card/blob/master/images/direction.gif?raw=true)
```yaml
entities:
  - sensor.example
  - sensor.example
  - sensor.example
title: Direction
direction: up
height: 200px
stack: horizontal
type: 'custom:bar-card'
```

### 2.0.0 Default Layout (using [card-mod](https://github.com/thomasloven/lovelace-card-mod))
![](https://github.com/custom-cards/bar-card/blob/master/images/old_layout.gif?raw=true)
```yaml
entity: sensor.example
positions:
  icon: 'off'
  indicator: inside
  title: outside
type: 'custom:bar-card'
width: 70%
title: 2.0.0 Default Layout
style: |-
  bar-card-value {
    margin-right: auto;
    font-size: 13px;
    font-weight: bold;
    text-shadow: 1px 1px #0005;
  }
```

### Custom CSS Layout (using [card-mod](https://github.com/thomasloven/lovelace-card-mod))
![](https://github.com/custom-cards/bar-card/blob/master/images/customcss.gif?raw=true)
```yaml
entity: sensor.example
positions:
  icon: 'off'
  indicator: 'off'
  minmax: inside
  title: inside
  value: inside
style: |-
  bar-card-value {
    margin-right: auto;
    margin-left: auto;
    margin-bottom: auto;
    margin-top: 0px;
  }
  bar-card-minvalue {
    margin-top: 0px;
    margin-left: 8px;
    margin-right: auto;
    margin-bottom: -13px;
    bottom: 8px;
  }
  bar-card-maxvalue {
    margin-bottom: 0px;
    margin-right: 8px;
    margin-left: auto;
    margin-top: -13px;
    top: 6px;
  }
  bar-card-divider {
    display: none;
  }
  bar-card-contentbar {
    flex-direction: column;
  }
  bar-card-title {
    margin-bottom: 0px;
  }
title: Custom CSS Layout
type: 'custom:bar-card'
```

## Credits
Inspired by [Big Number Card](https://github.com/ciotlosm/custom-lovelace/tree/master/bignumber-card) by [ciotlosm](https://github.com/ciotlosm).

## Links
[Home Assistant Community Topic](https://community.home-assistant.io/t/lovelace-bar-card/87503)
