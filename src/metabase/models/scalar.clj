(ns metabase.models.scalar
    "Underlying DB model for the scalar value this scalar can be composited of several source types, ranging from an manually entered value, to calculated from a query."
    (:require
      [clj-time
       [core :as t]
       [format :as tf]]
      [medley.core :as m]
      [metabase.models
       [dependency :as dependency]
       [interface :as i]
       [revision :as revision]]
      [metabase
       [public-settings :as public-settings]
       [query :as q]
       [query-processor :as qp]
       [util :as u]]
      [toucan
       [db :as db]
       [hydrate :refer [hydrate]]
       [models :as models]] [metabase.events :as events]))

(models/defmodel Scalar :scalar)


;;; ---------------------------------------------- Permissions Checking ----------------------------------------------

(defn- perms-objects-set
       "Allow the scalar table to be read or written to"
  [scalar read-or-write]
       (let [table (or (:table scalar)
                       (db/select-one ['Table :db_id :schema :id] :id (:table_id scalar)))]
            (i/perms-objects-set table read-or-write)))

(u/strict-extend (class Scalar)
                 models/IModel
                 (merge models/IModelDefaults
                        {:types      (constantly {:definition :json, :description :clob})
                         :properties (constantly {:timestamped? true})})
                 i/IObjectPermissions
                 (merge i/IObjectPermissionsDefaults
                        {
                         ;;Don't think I need the perms set
                         ;;:perms-objects-set perms-objects-set
                         :can-read?         (partial i/current-user-has-full-permissions? :read)
                         :can-write?        (partial i/current-user-has-full-permissions? :write)}))

;;; -------------------------------------------------- Dependencies --------------------------------------------------


(defn scalar-dependencies
      "Calculate any dependent objects for a given `Scalar` that is stored in the *definition* field."
      [this id {:keys [definition]}]
      (when definition
            {:Segment (q/extract-segment-ids definition)}))

(u/strict-extend (class Scalar)
                 dependency/IDependent
                 {:dependencies scalar-dependencies})

;;; -------------------------------------------------- Helpers --------------------------------------------------

(defn- day->iso8601 [date]
       (tf/unparse (tf/formatters :year-month-day) date))

(defn- date-between
       [start end field]
       ["BETWEEN" field (day->iso8601 start) (day->iso8601 end)])

;;; -------------------------------------------------- Revisions --------------------------------------------------


(defn- serialize-scalar
       "Serialize a `Scalar` for use in a `Revision`."
       [_ _ instance]
       (dissoc instance :created_at :updated_at))

(defn- diff-scalar
       "Gets and returns a diff between two `Scalar` types into a third."
       [this scalar1 scalar2]
       (if-not scalar1
               ;; this is not the first time we have viewed this scalar
               (m/map-vals (fn [v] {:after v}) (select-keys scalar1 [:name :description :definition]))
               ;; diff based on the incoming scalars
               (let [base-diff (revision/default-diff-map this
                                                          (select-keys scalar1 [:name :value :description :definition])
                                                          (select-keys scalar2 [:name :value :description :definition]))]
                    (cond-> (merge-with merge
                                        (m/map-vals (fn [v] {:after v}) (:after base-diff))
                                        (m/map-vals (fn [v] {:before v}) (:before base-diff)))
                            (or (get-in base-diff [:after :definition])
                                (get-in base-diff [:before :definition]))
                            (assoc :definition {
                                                :before (get-in scalar1 [:definition])
                                                :after (get-in scalar2 [:definition])})))))

(u/strict-extend (class Scalar)
       revision/IRevisioned
       (merge revision/IRevisionedDefaults
              {:serialize-instance serialize-scalar
               :diff-map           diff-scalar}))


;;; -------------------------------------------------- Lifecycle And Persistence --------------------------------------------------

(defn- native-query? [query-type]
       (or (= query-type "native")
           (= query-type :native)))

;;; TODO test all publish events for Scalar model
(defn create!
      "Create a new `Scalar`.
       Returns the newly created `Scalar` or throws an Exception."
      [scalar-name scalar-value description creator-id date definition]
      {:pre [(string? scalar-name)
             (integer? creator-id)
             (map? definition)]}
      (let [scalar (db/insert! Scalar
                     :created_by  creator-id
                     :name        scalar-name
                     :value       scalar-value
                     :is_active   true
                     :description description
                     :definition  definition
                     :date        date)]
           (println "The new scalar: " scalar)
           (-> (events/publish-event! :scalar_create scalar)
               (hydrate :creator))))

(defn exists?
        "Does an *active* `Scalar` with a givefn ID exist?"
        ^Boolean [id]
      {:pre [(integer? id)]}
      (db/exists? Scalar :id id, :is_active true))

(defn fetch-scalar
      "Fetch a single `Scalar` by its ID value. Hydrates its `:creator`."
      [id]
      {:pre [(integer? id)]}
      (-> (Scalar id)
          (hydrate :creator)))

(defn fetch-scalars
      "Fetch all `Scalars` for a given `Name`. Optional second and third arguments allows for the specification of a date-time range in which to bind this scalar. Will always select only active `Scalars`"
      ([name]
        (fetch-scalars name nil nil))
      ([name date-in date-out]
        (-> (db/select Scalar
             {:where [:and [:= :is_active true]
                     [:= :name name]
                      ;; if our date-in and date-out are both set,
                     (if (and (some? date-in) (some? date-out))
                       ;; make sure our query limits to between the dates!
                       [:= true (date-between date-in date-out :date)]
                       ;; otherwise, tie to true
                       true)]
              :order-by [[:name :asc]]})
            (hydrate :creator))))

(defn update!
      "Update an existing `Scalar`.
       Returns the updated `Scalar` or throws an Exception."
      [{:keys [id name definition scalar-value revision_message], :as body} user-id]
      {:pre [(integer? id)
             (integer? scalar-value)
             (string?  name)
             (map? definition)
             (string? revision_message)
             (string? user-id)]}
      (db/update! Scalar id
        (select-keys body #{:definition :scalar-value :description :name}))
      (u/prog1 (fetch-scalar id) (events/publish-event! :scalar_update (assoc <> :actor_id user-id, :revision_message revision_message))))

(defn delete!
      "Delete a `Scalar`.
       Preforms a soft delete by marking this `Scalar` as non-active. It does not remove the physical record at all. returns the finial state of the `Scalar`."
      [id user-id revision-message]
      {:pre [(integer? id)
             (integer? user-id)
             (string? revision-message)]}
      ;; make the `Scalar` not active
      (db/update! Scalar id, :is_active false)
      (u/prog1 (fetch-scalar id)
        (events/publish-event! :scalar-delete (assoc <> :actor_id user-id, :revision_message revision-message))))

