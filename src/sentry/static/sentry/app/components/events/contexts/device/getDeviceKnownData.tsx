import {KeyValueListData} from 'sentry/components/events/interfaces/keyValueList/types';
import {getMeta} from 'sentry/components/events/meta/metaProxy';
import {defined} from 'sentry/utils';

import getDeviceKnownDataDetails from './getDeviceKnownDataDetails';
import {DeviceData, DeviceKnownDataType} from './types';

function getOperatingSystemKnownData(
  data: DeviceData,
  deviceKnownDataValues: Array<DeviceKnownDataType>
): Array<KeyValueListData> {
  const knownData: Array<KeyValueListData> = [];

  const dataKeys = deviceKnownDataValues.filter(deviceKnownDataValue =>
    defined(data[deviceKnownDataValue])
  );

  for (const key of dataKeys) {
    const knownDataDetails = getDeviceKnownDataDetails(data, key as DeviceKnownDataType);

    knownData.push({
      key,
      ...knownDataDetails,
      meta: getMeta(data, key as keyof DeviceData),
    });
  }

  return knownData;
}

export default getOperatingSystemKnownData;
