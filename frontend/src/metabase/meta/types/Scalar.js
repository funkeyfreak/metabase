/* @flow */

import type {ISO8601Time} from "metabase/meta/types/index";

export type ScalarId = number;

// TODO: funkeyfreak - May be incomplete? Checkout ./Metric.js
export type Scalar = {
    name: string,
    id: ScalarId,
    date: ISO8601Time,
    is_active: boolean
};
