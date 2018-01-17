/* @flow weak */

import Base from "./Base";

import Database from "./Database";
import Table from "./Table";
import Field from "./Field";
import Segment from "./Segment";
import Metric from "./Metric";
import Scalar from "./Scalar.js"

import type { DatabaseId } from "metabase/meta/types/Database";
import type { TableId } from "metabase/meta/types/Table";
import type { FieldId } from "metabase/meta/types/Field";
import type { MetricId } from "metabase/meta/types/Metric";
import type { ScalarId } from "metabase/meta/types/Scalar";
import type { SegmentId } from "metabase/meta/types/Segment";

/**
 * Wrapper class for the entire metadata store
 */
export default class Metadata extends Base {
    databases: { [id: DatabaseId]: Database };
    tables: { [id: TableId]: Table };
    fields: { [id: FieldId]: Field };
    metrics: { [id: MetricId]: Metric };
    scalars: { [id: ScalarId]: Scalar};
    segments: { [id: SegmentId]: Segment };

    databasesList(): Database[] {
        // $FlowFixMe
        return (Object.values(this.databases): Database[]);
    }

    tablesList(): Database[] {
        // $FlowFixMe
        return (Object.values(this.tables): Database[]);
    }

    metricsList(): Metric[] {
        // $FlowFixMe
        return (Object.values(this.metrics): Metric[]);
    }

    scalarList(): Scalar[] {
        //$FlowFixMe
        return (Object.values(this.scalars): Scalar[]);
    }

    segmentsList(): Metric[] {
        // $FlowFixMe
        return (Object.values(this.segments): Segment[]);
    }
}
