# bar-card

## [Examples](#examples-1)

![Default](https://github.com/custom-cards/bar-card/blob/master/images/default.gif?raw=true)

![Severity](https://github.com/custom-cards/bar-card/blob/master/images/severity.gif?raw=true)

![Entity Row](https://github.com/custom-cards/bar-card/blob/master/images/entity_row.gif?raw=true)

![Direction](https://github.com/custom-cards/bar-card/blob/master/images/direction.gif?raw=true)

![Old Layout](https://github.com/custom-cards/bar-card/blob/master/images/old_layout.gif?raw=true)

![Custom CSS](https://github.com/custom-cards/bar-card/blob/master/images/customcss.gif?raw=true)

## Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| type | string | **Required** | `custom:bar-card`
| entity | string | **Required** | Entity State
| animation | object | none | Defines animation options. See [Animation Options](#animation-options).
| attribute | string | none | Displays a specific attribute instead of state value.
| color | string | var(--custom-bar-card-color, var(--primary-color)) | Color of the bar.
| columns | number | none | Defines the amount of bars to be displayed on a single row when multiple entities are defined.
| complementary | boolean | false | Displays complementary value (max - state_value) instead state value.
| decimal | number | none | The amount of decimals to be displayed for the value.
| direction | string | right | Direction of the bar. `right`, `up`
| entities | array | none | A list of entities. Accepts individual config options per defined entity.
| entity_config | boolean | false | Sets the card to use the configured entity attributes as the card config.
| entity_row | boolean | false | Removes the background card for use inside entities card.
| height | string | 40px | Defines the height of the bar.
| icon | string | icon | Defines the icon to be displayed.
| limit_value | boolean | false | Limits value displayed to `min` and `max` value.
| max | number | 100 | Defines maximum value of the bar.
| min | number | 0 | Defines minimum value of the bar.
| name | string | none | Defines custom entity name.
| positions | object | none | Defines the positions of the card elements. See [Positions Options](#positions-options).
| severity | object | none | A list of severity values. See [Severity Options](#severity-options).
| tap_action | string | info | Sets the action when tapping the bar. `info`, `service`
| target | number | none | Defines and enables target marker value.
| title | string | none | Adds title header to the card.
| unit_of_measurement | string | attribute | Defines the unit of measurement to be displayed.
| width | string | 100% | Defines the width of the bar.

## Severity Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| from | number | **Required** | Defines from which value the color should be displayed.
| to | number | **Required** | Defines to which value the color should be displayed.
| color | array | **Required** | Defines the color to be displayed.

## Animation Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| state | string | off | Enables or disables animation. `on`, `off`
| speed | number | 5 | Defines the speed of the bar animation in seconds.

## Positions Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| icon | string | outside | `inside`, `outside`, `off`
| indicator | string | outside | `inside`, `outside`, `off`
| name | string | inside | `inside`, `outside`, `off`
| minmax | string | off | `inside`, `outside`, `off`
| value | string | inside | `inside`, `outside`, `off`

## Theme Variables

| Name | Description
| ---- | ----
| bar-card-color | Defines the default bar color.
| bar-card-border-radius | Defines the default border radius of the bar.
| bar-card-disabled-color | Defines the bar color when state is `unavailable`.

## CSS Elements

See [example](#200-default-layout-requires-card-mod). (**requires** [card-mod](https://github.com/thomasloven/lovelace-card-mod))

| Name | Description
| ---- | ----
| bar-card-card | The root bar of each defined entity containing all elements.
| bar-card-background | Contains bar and any elements `outside` of the bar.
| bar-card-backgroundbar | The background of the bar.
| bar-card-currentbar | The filled part of the bar.
| bar-card-contentbar | Contains all elements `inside` of the bar.
| ha-icon | Icon element.
| bar-card-iconbar | Contains ha-icon.
| bar-card-title | Title element.
| bar-card-min | Min value element.
| bar-card-divider | Min/Max divider element.
| bar-card-max | Max value element.
| bar-card-value | Value element.
| bar-card-animationbar | Animated part of the bar.
| bar-card-targetbar | Target bar element.
| bar-card-targetmarker | Target marker element.
| bar-card-indicator | Indicator element.
