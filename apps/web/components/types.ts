export type WidgetType =
  | string
  | {
      id: string;
      name?: string;
      data?: any;
    };
