(ns metabase.cmd.scalar_interface
  (:require [metabase.db :as mdb]
            [metabase.db.spec :as specs]
            [clj-time
             [local :as l]]
            [metabase.models.scalar :refer [Scalar] :as scalar]
            [toucan
             [db :as db]
             [hydrate :refer [hydrate]]]
            [metabase.util :as u]))

(defn- h2-details [h2-connection-string-or-nil]
  (let [h2-filename (or h2-connection-string-or-nil @metabase.db/db-file)
        h2-full-conn (str h2-filename ";IFEXISTS=TRUE;database_to_upper=false")]
    (println "h2 connection " h2-full-conn)
    (mdb/jdbc-details {:type :h2, :db (str h2-filename ";IFEXISTS=TRUE;database_to_upper=false")})))

(defn set-h2-connection
  "Gets and reads the H2 connection for this app instance"
  []
  (db/set-default-db-connection! (h2-details nil)))


(defn set-scalar-helper
  [scalar-key scalar-value]
  (let [localtime (l/format-local-time (l/local-now) :date-time)]
    (scalar/create! scalar-key scalar-value (str "A scalar created using the terminal at " localtime ": {key:" scalar-key ", value:" scalar-value "}") 1 localtime (hash-map :calculation (hash-map :key scalar-key, :value scalar-value), :filter-at nil, :type "Float/parseFloat"))))

(defn- print-scalar-set
  "Get the current listing of key->many scalar key-pairs for this particular key"
  [scalar-key]
  (set-h2-connection)
  (println "Fetching scalar set for scalar-key " scalar-key)
  (let [fetched (scalar/fetch-scalars scalar-key)]
    (println (u/format-color 'blue "Successful: found for key: ") scalar-key ": value: " fetched)))

(defn- set-scalar!
  "Set the given scalar value to a new value. If the scalar does not exist, it will be created - be careful about your spelling."
  [scalar-key scalar-value]
  {:pre [(float? scalar-value)]}
  (set-h2-connection)
  (println scalar-key)
  (println (l/format-local-time (l/local-now) :date-time))
  (let [localtime (l/format-local-time (l/local-now) :date-time)
        created-scalar (scalar/create! scalar-key scalar-value (str "A scalar created using the terminal at " localtime ": {key:" scalar-key ", value:" scalar-value "}") 1 localtime (hash-map :calculation (hash-map :key scalar-key, :value scalar-value), :filter-at nil, :type "Float/parseFloat"))
        ]
    (println "Setting a new/adding to an existing scalar by the name of " scalar-key " with the value " scalar-value ". Using local time @" localtime)

    (println (u/format-color 'blue "Successful: created for key: ") scalar-key "  The new Scalar object: "
             created-scalar
             ;;(scalar/create! scalar-key scalar-value (str "A scalar created using the terminal at " localtime ": {key:" scalar-key ", value:" scalar-value "}") 1 localtime (hash-map :calculation (hash-map :key scalar-key, :value scalar-value), :filter-at nil, :type "Float/parseFloat"))
             )))

(defn- get-scalar-by-id
  "Get a scalar value by it's id."
  [scalar-id]
  {:pre [(integer? scalar-id)]}
  (set-h2-connection)
  (println
    (u/format-color 'blue "Successful: found the following record at the given id:")
    (db/select-one Scalar {:where [:= :id scalar-id]})))

(defn- get-scalar
  "Get a scalar value by it's distinct values of a key name, a value, and a date at which it was inserted. This will allow us to not only associate a scalar with some non-id value, but also an entry point into which we can then delete/modify an existing scalar value."
  [scalar-key scalar-value scalar-date]
  {:pre [(float? scalar-value)
         (string? scalar-key)]}
  (set-h2-connection)
  (let [fetched-id (-> (db/select-one Scalar
                                      {:where [:and [:= :name scalar-key]
                                               [:= :value scalar-value]
                                               [:= :date scalar-date]]})
                       (hydrate :creator))]
    (println (u/format-color 'blue "Successful: found the following record that matched: ") "{name: " scalar-key ", value: " scalar-value ", date: " scalar-date "}" fetched-id)))

