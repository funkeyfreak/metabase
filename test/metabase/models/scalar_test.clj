(ns metabase.models.scalar-test
(:require [expectations :refer :all]
          [clj-time
           [core :as t]
           [local :as l]]
          [metabase.models
           [database :refer [Database]]
           [scalar :as scalar :refer :all]
           [table  :refer [Table]]]
          [metabase.test.data :refer :all]
          [metabase.test.data.users :refer :all]
          [metabase.util :as u]
          [toucan.util.test :as tt]))

;; Helper functions and types

(def ^:private ^:const scalar-defaults
  {:description       nil
   :is_active         true
   :definition        {}})

(defn- user-details
  [username]
  (dissoc (fetch-user username) :date_joined :last_login))

(defn- scalar-details
  [{:keys [creator] :as scalar}]
  (-> (dissoc scalar :id :date :created_at :updated_at)
      (update :creator (u/rpartial dissoc :date_joined :last_login))))

(defn- create-scalar-then-select!
  [name value description creator-id date definition]
  (scalar-details (create! name value description creator-id date definition)))

(defn- update-scalar-then-select!
  [scalar]
  (scalar-details (update! scalar (user->id :crowberto)))
  (dissoc scalar :id :date :created_at :updated_at))

(def time-now (l/format-local-time (t/date-time 2011 11 11) :date-time))


;; TESTS: scalar/create!
(expect
  (merge scalar-defaults
         {:creator_id (user->id :rasta)
          :creator    (user-details :rasta)
          :name       "bob"
          :description "The answer to life, the universe, and everything"
          :value      42.0
          :definition {:clause ["a" "b"]}})
  (create-scalar-then-select! "bob" 42 "The answer to life, the universe, and everything" (user->id :rasta) time-now {:clause ["a" "b"]}))


;; TESTS: If a scalar exists
(expect
  [true
   false]
  (tt/with-temp* [Scalar [{scalar-id :id} {
                            :name "test"
                            :creator_id  (user->id :rasta)
                            :definition {:query    {:filter ["yay"]}}
                            :date  time-now
                            :value 45.00}]]
                 [(scalar/exists? scalar-id)
                  (scalar/exists? Integer/MAX_VALUE)]))


;; TESTS: The retrieval of a scalar @ scalar/fetch-scalar id
(expect
  (merge scalar-defaults
         {:creator_id   (user->id :rasta)
          :creator      (user-details :rasta)
          :name         "ToucanSan"
          :description  "Toucans in the rainforest, a lookin' for a blueberry"
          :value        77.99
          :definition   {:meta
                         {:accessed 1
                          :last_accessed time-now
                          :last_values [44.00, 56.00, 28.00, 77.99]}
                         :base_type "type/Float"
                         :type      "static"
                         :query
                         {:scalar 77.99}}})
  (tt/with-temp* [Scalar [{scalar-id :id}
                          {:creator_id   (user->id :rasta)
                           :definition {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}
                           :name         "ToucanSan"
                           :description  "Toucans in the rainforest, a lookin' for a blueberry"
                           :value         77.99}]]
                 (let [{:keys [creator] :as scalar} (fetch-scalar scalar-id)]
                   (update (dissoc scalar :id :date :created_at :updated_at)
                           :creator (u/rpartial dissoc :date_joined :last_login)))))


;; TESTS: The retrieval of all scalars that match a key @ scalar/fetch-scalars key
(expect
  [(merge scalar-defaults
          {:creator_id   (user->id :rasta)
           :creator     (user-details :rasta)
           :name "Test"
           :value 2.88
           :description "Should show!"
           :definition {:stop "please"}})
   (merge scalar-defaults
          {:creator_id (user->id :rasta)
           :creator     (user-details :rasta)
           :name       "Test"
           :value      2.2
           :description "Same"
           :definition {:stop "please"}})]
  (tt/with-temp* [
    Scalar [{scalar-one :id}
            {:creator_id   (user->id :rasta)
             :name "Test"
             :value 2.88
             :date time-now
             :description "Should show!"
             :definition {:stop "please"}}]
    Scalar [{scalar-one-point-two :id}
            {:creator_id (user->id :rasta)
             :name       "Test"
             :value      2.2
             :description "Same"
             :date time-now
             :definition {:stop "please"}}]
    Scalar [{scalar-two :id}
            {:creator_id   (user->id :rasta)
             :name "TestNotShowing"
             :value 99.89
             :date time-now
             :description "Not showing!"
             :definition {:stop "please"}}]
    Scalar [{scalar-two :id}
            {:creator_id   (user->id :rasta)
             :name "Test"
             :value 0.19
             :date time-now
             :description "Not active!"
             :definition {:stop "please"}
             :is_active false}]]
   (doall (for [scalar (u/prog1 (fetch-scalars "Test")
                               (assert (= 2 (count <>))))]
          (update (dissoc (into {} scalar) :id :date
                          :created_at :updated_at)
            :creator (u/rpartial dissoc :date_joined :last_login)
            :description nil)))))

;; TODO TESTS: The retrieval of all scalars that match a key and date



;; TESTS: The updating of a scalar
;; NOTE: This does a few extra things, such as:
;;    1. Tests the updating of the scalar name
;;    2. Not allowing creator_to be mutated
;;    3. The description can be set to nil and a non-nil value
;;    4. We can modify the definition json
;;    5. The revision is captured into the revision table
(expect
  (dissoc (merge scalar-defaults
                 {:creator_id (user->id :crowberto)
                  ;;:creator    (user-details :rasta)
                  :name       "Costa Rica"
                  :value       42.00
                  :revision_message "Just horsing around"
                  :definition              {:meta
                                                       {:accessed 1
                                                        :last_accessed time-now
                                                        :last_values [44.00, 56.00, 28.00, 77.99]}
                                            :base_type "type/Float"
                                            :type      "static"
                                            :query
                                                       {
                                                        :scalar 77.99
                                                        }}})
          :is_active)
  (tt/with-temp* [Scalar [{scalar-id :id}
                          {:name "Costa Rica"
                           :value 22.55
                           :date time-now
                           :creator_id (user->id :rasta)
                           :definition {:database 2
                                        :query    {:filter ["not" "the toucans you're looking for"]}}}]]
                 (update-scalar-then-select! {:id                      scalar-id
                                              :name                    "Costa Rica"
                                              :value                   42.00
                                              :creator_id              (user->id :crowberto)
                                              :description nil
                                              :definition              {:meta
                                                                                   {:accessed 1
                                                                                    :last_accessed time-now
                                                                                    :last_values [44.00, 56.00, 28.00, 77.99]}
                                                                        :base_type "type/Float"
                                                                        :type      "static"
                                                                        :query
                                                                                   {
                                                                                    :scalar 77.99
                                                                                    }}
                                              :revision_message        "Just horsing around"})))

;; TESTS: The removal of a scalar using scalar/delete
(expect
  (merge scalar-defaults
         {:creator_id  (user->id :rasta)
          :creator     (user-details :rasta)
          :name        "Toucans in the rainforest"
          :value       22.55
          :description "Lookin' for a blueberry"
          :definition   {:hello "is it me you're looking for"}
          :is_active   false})
  (tt/with-temp* [Scalar   [{scalar-id :id} {
                             :creator_id (user->id :rasta)
                             :date time-now
                             :name       "Toucans in the rainforest"
                             :value      22.55
                             :definition   {:hello "is it me you're looking for"}

                             :description "Lookin' for a blueberry"}]]
                 (delete! scalar-id (user->id :crowberto) "revision message")
                 (scalar-details (fetch-scalar scalar-id))))

;; TESTS: The revisions of a scalar @ scalar/serialize-scalar
(expect
  (merge scalar-defaults
         {:id          true
          :creator_id  (user->id :rasta)
          :name        "Toucans in the rainforest"
          :value       22.2
          :description "Lookin' for a blueberry"
          :definition  {:aggregation ["count"]
                        :filter      ["AND" [">" 4 "2014-10-19"]]}})
  (tt/with-temp* [Scalar   [scalar         {:name       "Toucans in the rainforest"
                                            :creator_id (user->id :rasta)
                                            :value      22.2
                                            :date time-now
                                            :description "Lookin' for a blueberry"
                                            :definition {:aggregation ["count"]
                                          :filter      ["AND" [">" 4 "2014-10-19"]]}}]]
                 (-> (#'scalar/serialize-scalar Scalar (:id scalar) scalar)
                     (dissoc scalar :date)
                     (update :id boolean))))

;; TESTS: The difference between two revisions of scalar @ scalar/diff-scalar

(expect
  {:definition  {:before {:filter ["AND" [">" 4 "2014-10-19"]]}
                 :after  {:filter ["AND" ["BETWEEN" 4 "2014-07-01" "2014-10-19"]]}}
   :description {:before "Lookin' for a blueberry"
                 :after  "BBB"}
   :name        {:before "Toucans in the rainforest"
                 :after  "Something else"}
   :value       {:before  22.2
                 :after   42.0}}
  (tt/with-temp* [Scalar   [scalar
                            {:name "Toucans in the rainforest"
                             :value 22.2
                             :creator_id (user->id :rasta)
                             :description "Lookin' for a blueberry"
                             :date time-now
                             :definition {:filter ["AND" [">" 4 "2014-10-19"]]}}]]
                 (#'scalar/diff-scalar Scalar scalar (assoc scalar
                    :name        "Something else"
                    :value       42.0
                    :description "BBB"
                    :creator_id (user->id :rasta)
                    :definition  {:filter ["AND" ["BETWEEN" 4 "2014-07-01" "2014-10-19"]]}))))

;; TESTS: The definition has not changed @ scalar/diff-scalar
(expect
  {:name {:before "A"
          :after  "B"}}
  (#'scalar/diff-scalar Scalar
    {:name        "A"
     :value       12.12
     :description "Unchanged"
     :definition  {:filter ["AND" [">" 4 "2014-10-19"]]}}
    {:name        "B"
     :value       12.12
     :description "Unchanged"
     :definition  {:filter ["AND" [">" 4 "2014-10-19"]]}}))

;; TESTS: Comparing against nil @ scalar/diff-scalar
(expect
  {:name        {:after  "A"}
   :value       12.12
   :description {:after "Unchanged"}
   :definition  {:after {:filter ["AND" [">" 4 "2014-10-19"]]}}}
  (#'scalar/diff-scalar Scalar
    nil
    {:name        "A"
     :value       12.12
     :description "Unchanged"
     :definition  {:filter ["AND" [">" 4 "2014-10-19"]]}}))

;; TESTS: The removal of an object in the definition
(expect
  {:definition  {:before {:filter ["AND" [">" 4 "2014-10-19"] ["=" 5 "yes"]]}
                 :after  {:filter ["AND" [">" 4 "2014-10-19"]]}}}
  (#'scalar/diff-scalar Scalar
    {:name        "A"
     :value       12.12
     :description "Unchanged"
     :definition  {:filter ["AND" [">" 4 "2014-10-19"] ["=" 5 "yes"]]}}
    {:name        "A"
     :value       12.12
     :description "Unchanged"
     :definition  {:filter ["AND" [">" 4 "2014-10-19"]]}}))



;; ## TESTS: The handling of scalar dependencies @ scalar/scalar-dependencies

(expect
  {:Segment #{2 3} :Metric nil}
  (scalar-dependencies Scalar 12 {:definition {:aggregation ["rows"]
                                               :breakout    [4 5]
                                               :filter      ["AND" [">" 4 "2014-10-19"] ["=" 5 "yes"] ["SEGMENT" 2] ["SEGMENT" 3]]}}))

(expect
  {:Segment #{1} :Metric #{7}}
  (scalar-dependencies Scalar 12 {:definition {:aggregation ["METRIC" 7]
                                               :filter      ["AND" [">" 4 "2014-10-19"] ["=" 5 "yes"] ["OR" ["SEGMENT" 1] ["!=" 5 "5"]]]}}))

(expect
  {:Segment nil :Metric nil}
  (scalar-dependencies Scalar 12 {:definition {:aggregation nil
                                               :filter      nil}}))
