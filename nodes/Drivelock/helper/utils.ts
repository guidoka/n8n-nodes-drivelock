export type DynamicFields = {
  [key: string]: string | null;
};

export type Payload = Record<string, DynamicFields>;

export type ExtentionPayload = Record<string, Record<string, string>>;

export type CustomProps = Record<string, ExtensionGroup>;

export type ExtensionGroup = Record<string, ExtensionProperty>;

export type ExtensionProperty = {
  propType: 'String' | 'Int' |'Bool' | 'DateTime';
  description: string;
  displayText: {
    enu: string;
    deu: string;
  };
  propertyGroup: string;
  orderId: number;
};
export interface DriveLockQuery {
    // bekannte Basis-Parameter
    sortBy?: string;
    select?: string | null;
    query?: string | null;
    getTotalCount?: boolean;
    getFullObjects?: boolean;
    getAsFlattenedList?: boolean;
    take?: number;
    skip?: number;

    // erlaubt beliebige weitere Parameter
    [key: string]: string | number | boolean | null | undefined;
}

export interface DriveLockApiResponse<T> {
	data: T;
	total?: number | null;      // optional
	additionalInfo?: number;    // optional
	timeStamp?: string;         // optional
  [key: string]: unknown;     // optional beliebige weitere Felder
}

export interface CustomPropsResponse {
    customProps: {
        [key: string]: ExtensionGroup;
    };
}

export interface DriveLockItem {
	id?: string;
	[key: string]: unknown;
}