import { IDataObject } from 'n8n-workflow';

import { Payload, CustomProps, ExtensionGroup } from './utils';

export function hasNestedProperty(obj: unknown, path: string[]): boolean {
  let current: Record<string, unknown> | undefined;

  if (typeof obj === "object" && obj !== null) {
    current = obj as Record<string, unknown>;
  } else {
    return false;
  }

  for (const key of path) {
    if (!current || !(key in current)) {
      return false;
    }
    const next = current[key];
    if (typeof next === "object" && next !== null) {
      current = next as Record<string, unknown>;
    } else if (key !== path[path.length - 1]) {
      // Noch nicht am Ende, aber kein Objekt → Pfad ungültig
      return false;
    } else {
      current = undefined;
    }
  }

  return true;
}

export function findExtensionsWithProperty(
  customProps: unknown,
  propertyName: string
): string[] {
  if (typeof customProps !== "object" || customProps === null) {
    return [];
  }

  const props = customProps as Record<string, unknown>;

  return Object.keys(props).filter(key => {
    if (!key.endsWith("Extensions")) return false;

    const group = props[key];
    if (typeof group !== "object" || group === null) return false;

    return Object.prototype.hasOwnProperty.call(
      group as Record<string, unknown>,
      propertyName
    );
  });
}

export function checkPropsAndTypes(
  extentionGroupItems: ExtensionGroup,
  customProperties: IDataObject[]
): Record<string, { name: boolean; datatype: boolean; changed: boolean }> {

  const result: Record<string, { name: boolean; datatype: boolean; changed: boolean }> = {};

  for (const item of customProperties) {

    result[item.propertyname as string] = { name: false, datatype: true, changed: false };

    if (extentionGroupItems && Object.prototype.hasOwnProperty.call(extentionGroupItems, item.propertyname as string)) {

      const prop = extentionGroupItems[item.propertyname as string];
      result[item.propertyname as string].name = true;
      result[item.propertyname as string].datatype = item.propertydatatype as string  === prop.propType;
      result[item.propertyname as string].changed = false;

      if (prop.description !== item.propertydescription ||
          prop.displayText.deu !== item.propertygermandisplayname ||
          prop.displayText.enu !== item.propertyenglishdisplayname) {

        result[item.propertyname as string].changed = true;

      }

    }

  }

  return result;
}


export function adjustProps(
  checkResult : Record<string, { name: boolean; datatype: boolean }>,
  extentionName: string,
  customProps: CustomProps,
  customProperties: IDataObject[],
): CustomProps {

  for (const item of customProperties) {

    if (!checkResult[item.propertyname as string].name) {

      const orderId = Object.keys(customProps[extentionName]).length + 1;
      const propertyGroup = `${extentionName}Base`;

      customProps[extentionName][item.propertyname as string] = {
        propType: item.propertydatatype as string as 'String' | 'Int' | 'Bool' | 'DateTime',
        description: item.propertydescription as string,
        displayText: { enu: item.propertyenglishdisplayname as string, deu: item.propertygermandisplayname as string },
        propertyGroup: propertyGroup,
        orderId: orderId,
      };

    } else if (checkResult[item.propertyname as string].name) {

      customProps[extentionName][item.propertyname as string].description = item.propertydescription as string;
      customProps[extentionName][item.propertyname as string].displayText = { enu: item.propertyenglishdisplayname as string, deu: item.propertygermandisplayname as string };
      customProps[extentionName][item.propertyname as string].orderId = item.orderId as number;

    }
    
  }

  return customProps;

}

function toStringSafe(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null; // api should handle
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable object]';
    }
  }

  return String(value); //try cast
}

export function createSetPayload(updateId: string, customProperties: IDataObject[]): Payload {

  const payload: Payload = {};
  payload[updateId] = {}; // Init object
  for (const item of customProperties) {
    payload[updateId][item.property as string] = toStringSafe(item.value);
  }

  return payload;

}
