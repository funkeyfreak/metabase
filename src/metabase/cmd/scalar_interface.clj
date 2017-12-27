(ns metabase.cmd.scalar_interface
  (:require [metabase.db :as mdb]
            [clj-time
             [local :as l]]
            [metabase.models.scalar :refer [Scalar] :as scalar]
            [toucan
             [db :as db]
             [hydrate :refer [hydrate]]]
            [metabase.util :as u]))

(defn- print-scalar-set
  "Get the current listing of key->many scalar key-pairs for this particular key"
  [scalar-key]
  (println "Fetching scalar set for scalar-key " scalar-key)
  (let [fetched (scalar/fetch-scalars scalar-key)]
    (println (u/format-color 'blue "Successful: found for key: ") scalar-key ": value: " fetched)))

(defn- set-scalar!
  "Set the given scalar value to a new value. If the scalar does not exist, it will be created - be careful about your spelling."
  [scalar-key scalar-value]

  {:pre [(float? scalar-value)]}
  (let [localtime (l/local-now)
        created-scalar (scalar/create scalar-key scalar-value (str "A scalar created using the terminal at " localtime ": {key:" scalar-key ", value:" scalar-value "}") 0 localtime "{}")
        ]
    (println "Setting a new/adding to an existing scalar by the name of " scalar-key " with the value " scalar-value ". Using local time @" localtime)

    (println (u/format-color 'blue  "Successful: created for key: ") scalar-key " The new Scalar object: " created-scalar)))


(defn- get-scalar
  "Get a scalar value by it's distinct values of a key name, a value, and a date at which it was inserted. This will allow us to not only associate a scalar with some non-id value, but also an entry point into which we can then delete/modify an existing scalar value."
  [scalar-key scalar-value scalar-date]
  {:pre [(float? scalar-value)
         (string? scalar-key)]}
  (let [fetched-id (-> (db/select-one Scalar
                                      {:where [:and [:= :name scalar-key]
                                               [:= :value scalar-value]
                                               [:= :date scalar-date]]})
                       (hydrate :creator))])
  (println (u/format-color 'blue "Successful: found the following record that matched: ") "{name: " scalar-key ", value: " scalar-value ", date: " scalar-date "}"))

