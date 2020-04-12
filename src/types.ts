import { ActionConfig } from 'custom-card-helpers';

// TODO Add your configuration elements here for type-checking
export interface BarCardConfig {
  entity_config: boolean;
  animation: any;
  attribute: any;
  color: string;
  columns: number;
  decimal: any;
  direction: string;
  double_tap_action?: ActionConfig;
  entities: any;
  entity_row: boolean;
  entity: string;
  height: string;
  hold_action?: ActionConfig;
  icon: any;
  limit_value: boolean;
  max: number;
  min: number;
  name: string;
  positions: any;
  service_options: { domain: string; service: string; data: any };
  severity: any;
  stack: string;
  tap_action?: ActionConfig;
  target: any;
  title: string;
  type: string;
  unit_of_measurement: string;
  width: string;
}
