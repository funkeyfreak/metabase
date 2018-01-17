import { createSelector } from 'reselect';
import { computeMetadataStrength } from "metabase/lib/schema_metadata";

const scalarSelector          = (state, props) => state.dashboard.datamodel.scalars;
const previewSummarySelector   = (state, props) => state.dashboard.datamodel.previewSummary;
const revisionObjectSelector   = (state, props) => state.dashboard.datamodel.revisionObject;
const globalMetadataSelector = (state, props) => state.dashboard.datamodel.globalMetadata;

const idSelector               = (state, props) => props.params.id == null ? null : parseInt(props.params.id);

const userSelector             = (state, props) => state.currentUser;

export const scalarEditSelectors = createSelector(
    scalarSelector,
    idSelector,
    globalMetadataSelector,
    (scalars, id, globalMetadata) => ({
        scalar: id == null ?
            { id: null, value: 0, date: Date.now(), definition: {
                null}} : scalar[id],
        globalMetadata
    })
);

export const scalarFormSelectors = createSelector(
    scalarEditSelectors,
    previewSummarySelector,
    ({ scalar, globalMetadata }, previewSummary) => ({
            initialValues: scalar,
            globalMetadata,
            previewSummary
        })
);

export const revisionHistorySelectors = createSelector(
    revisionObjectSelector,
    globalMetadataSelector,
    userSelector,
    (revisionObject, globalMetadata, user) => ({
        ...revisionObject,
        globalMetadata,
        user
    })
);
