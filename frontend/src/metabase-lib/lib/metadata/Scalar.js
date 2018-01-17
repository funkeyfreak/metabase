/* @flow weak */

import Base from "./Base";

import type { Aggregation } from "metabase/meta/types/Query";

/**
 * Wrapper class for a metric. Belongs to a {@link Database} and possibly a {@link Table}
 */
export default class Scalar extends Base {
    displayName: string;
    description: string;
    value:       number;


    aggregationClause(): Aggregation {
        return ["SCALAR", this.id];
    }

    isActive(): boolean {
        return !!this.is_active;
    }
}
