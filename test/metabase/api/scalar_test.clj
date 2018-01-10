(ns metabase.api.scalar-test
  (:require [expectations :refer :all]
            [clj-time
             [core :as t]
             [local :as l]]
            [metabase
             [http-client :as http]
             [middleware :as middleware]]
            [metabase.models
             [database :refer [Database]]
             [scalar :as scalar :refer [Scalar]]
             [revision :refer [Revision]]]
            [metabase.test
             [data :as data :refer :all]
             [util :as tu]]
            [metabase.test.data.users :refer :all]
            [toucan.hydrate :refer [hydrate]]
            [toucan.util.test :as tt]))

;; =========================================================================
;; ====== A few helper functions ======

(def ^:private ^:const scalar-defaults
  {:updated_at        true
   :created_at        true
   :description       nil
   :is_active         true
   :definition        {}})

(defn- user-details [user]
  (tu/match-$ user
              {:id           $
               :email        $
               :date_joined  $
               :first_name   $
               :last_name    $
               :last_login   $
               :is_superuser $
               :is_qbnewb    $
               :common_name  $}))

(defn- scalar-response [{:keys [created_at updated_at], :as scalar}]
  (-> (into {} scalar)
      (dissoc :id :date )
      ;;(update :creator_id #(into {} %))
      (assoc :created_at (some? created_at)
             :updated_at (some? updated_at))))

(def time-now (l/format-local-time (t/date-time 2011 11 11) :date-time))

;; =========================================================================
;; TESTS: The authentication of our endpoint. Will not be full coverage, as the method
;; should be universal for each endpoint created @ /api/scalar/*

(expect (get middleware/response-unauthentic :body) (http/client :get 401 "scalar"))
(expect (get middleware/response-unauthentic :body) (http/client :put 401 "scalar/76"))

;; =========================================================================
;; TESTBED: Testing the POST method @ /api/scalar ==========================

;; TESTS: Makes sure that the endpoint posts WITHOUT super user permissions

(expect (merge scalar-defaults
          {:name        "WootWoot"
           :value       42.2
           :description "It Works!"
           :creator_id  (user->id :rasta)
           :creator     (user-details (fetch-user :rasta))
           :definition  {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}}
          )
        (scalar-response ((user->client :rasta) :post 200 "scalar"
                           {:name "WootWoot"
                            :value 42.2
                            :description "It Works!"
                            :date   time-now
                            :definition {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}})))

;; TESTS: Makes sure that the endpoint posts WITH super user permissions

(expect (merge scalar-defaults
               {:name        "WootWoot"
                :value       42.2
                :description "It Works!"
                :creator_id  (user->id :crowberto)
                :creator     (user-details (fetch-user :crowberto))
                :definition  {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}})
        (scalar-response ((user->client :crowberto) :post 200 "scalar"
                           {:name "WootWoot"
                            :value 42.2
                            :description "It Works!"
                            :date   time-now
                            :definition {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}})))

;; TESTS: The validations @ /api/scalar

(expect {:errors {:name "value must be a non-blank string."}}
        ((user->client :crowberto) :post 400 "scalar" {}))

(expect {:errors {:definition "value must be a map."}}
        ((user->client :crowberto) :post 400 "scalar" {:name "abc"}))

;; =========================================================================
;; TESTBED: Testing the PUT method @ /api/scalar ===========================

;; TESTS: Makes sure that the endpoint puts WITHOUT super user permissions

(expect
  (merge scalar-defaults
         {:name        "Updated"
          :value       72.2
          :description "It Works!"
          :creator_id  (user->id :rasta)
          :creator     (user-details (fetch-user :rasta))
          :definition  {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99, 42.2]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}})
  (tt/with-temp* [Scalar [{scalar-id :id}
                          {:name        "WootWoot"
                           :value       42.2
                           :description "It Works!"
                           :date        time-now
                           :creator_id  (user->id :rasta)
                           :definition  {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}}]]
     (scalar-response ((user->client :rasta) :put 200 (format "scalar/%d" scalar-id)
                        {:id   scalar-id
                         :name "Updated"
                         :revision_message "whatttt"
                         :value 72.2
                         :description "It Works!"
                         :date   time-now
                         :definition {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99, 42.2]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}}))))

;; TESTS: Makes sure that the endpoint puts WITH super user permissions

(expect
  (merge scalar-defaults
         {:name        "Updated"
          :value       72.2
          :description "It Works!"
          :creator_id  (user->id :crowberto)
          :creator     (user-details (fetch-user :crowberto))
          :definition  {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99, 42.2]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}})
  (tt/with-temp* [Scalar [{scalar-id :id}
                          {:name        "WootWoot"
                           :value       42.2
                           :description "It Works!"
                           :date        time-now
                           :creator_id  (user->id :crowberto)
                           :definition  {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}}]]
                 (scalar-response ((user->client :crowberto) :put 200 (format "scalar/%d" scalar-id)
                                    {:id   scalar-id
                                     :name "Updated"
                                     :revision_message "whatttt"
                                     :value 72.2
                                     :description "It Works!"
                                     :date   time-now
                                     :definition {:meta {:accessed 1 :last_accessed time-now :last_values [44.00, 56.00, 28.00, 77.99, 42.2]} :base_type "type/Float" :type      "static" :query {:scalar 77.99}}}))))


;; TESTS: The validations @ /api/scalar/:id

(expect
  {:errors {:name "value must be a non-blank string."}}
  ((user->client :crowberto) :put 400 "scalar/1" {}))

(expect
  {:errors {:revision_message "value must be a non-blank string."}}
  ((user->client :crowberto) :put 400 "scalar/1" {:name "abc"}))

(expect
  {:errors {:revision_message "value must be a non-blank string."}}
  ((user->client :crowberto) :put 400 "scalar/1" {:name             "abc"
                                                  :revision_message ""}))

(expect
  {:errors {:definition "value must be a map."}}
  ((user->client :crowberto) :put 400 "scalar/1" {:name             "abc"
                                                  :revision_message "123"}))

(expect
  {:errors {:definition "value must be a map."}}
  ((user->client :crowberto) :put 400 "scalar/1" {:name             "abc"
                                                  :revision_message "123"
                                                  :definition       "foobar"}))
;; =========================================================================
;; TESTBED: Testing the DELETE method @ /api/scalar/:id ====================

;; TESTS: Makes sure that the endpoint deletes ONLY WITH super user permissions

(expect
  [(merge scalar-defaults
          {:name "Toucans in the rainforest"
           :value 33.3
           :creator_id (user->id :rasta)
           :creator    (user-details (fetch-user :rasta))
           :definition  {:key "value"}
           :description nil
           :is_active   false})]
  (tt/with-temp* [Scalar [{scalar-id :id}
                          {:name "Toucans in the rainforest"
                           :value 33.3
                           :date  time-now
                           :creator_id (user->id :rasta)
                           :definition  {:key "value"}
                           :description  nil
                           :is_active   false}]]
                 [((user->client :crowberto) :delete 200 (format "scalar/%d" scalar-id) :revision_message "carryon")
                  (scalar-response (scalar/fetch-scalar scalar-id))]))

;; TESTS: Makes sure that the endpoint posts WITH super user permissions

;; TESTS: The permissions @ /api/scalar/:id

(expect "You don't have permissions to do that."
        ((user->client :rasta) :delete 403 "scalar/1" :revision_message "yeeeehaw!"))

;; TESTS: The validations @ /api/scalar/:id

(expect {:errors {:revision_message "value must be a non-blank string."}}
        ((user->client :crowberto) :delete 400 "scalar/1" {:name "abc"}))

(expect {:errors {:revision_message "value must be a non-blank string."}}
        ((user->client :crowberto) :delete 400 "scalar/1" :revision_message ""))

;; =========================================================================
;; TESTBED: Testing the GET method @ /api/scalar/:id =======================

;; TESTS: Makes sure that the endpoint gets WITHOUT super user permissions

(expect
  (merge scalar-defaults
         {:name        "Toucans in the rainforest"
          :description "Lookin' for a blueberry"
          :creator_id  (user->id :crowberto)
          :definition  {:test "Testerson"}
          :creator     (user-details (fetch-user :crowberto))})
  (tt/with-temp* [Scalar [{scalar-id :id}
                          {:name        "Toucans in the rainforest"
                           :description "Lookin' for a blueberry"
                           :definition  {:test "Testerson"}
                           :date        time-now
                           :creator_id  (user->id :crowberto)}]]
                 (scalar-response ((user->client :crowberto) :get 200 (format "scalar/%d" scalar-id)))))


;; =========================================================================
;; TESTBED: Testing the POST method @ /api/scalar/:id/revision ==============

;; TESTS: Makes sure that the endpoint gets WITHOUT super user permissions

(expect
  [ ;; the api response
   {:is_reversion true
    :is_creation  false
    :message      nil
    :user         (dissoc (user-details (fetch-user :crowberto)) :email :date_joined :last_login :is_superuser :is_qbnewb)
    :diff         {:name {:before "Changed Scalar Name"
                          :after  "One Scalar to rule them all, one scalar to define them"}
                   :value        {:before 42.2
                                  :after  72.2}}
    :description  "renamed this Scalar from \"Changed Scalar Name\" to \"One Scalar to rule them all, one scalar to define them\"."}

   ;; full list of final revisions, first one should be same as the revision returned by the endpoint
   [{:is_reversion true
     :is_creation  false
     :message      nil
     :user         (dissoc (user-details (fetch-user :crowberto)) :email :date_joined :last_login :is_superuser :is_qbnewb)
     :diff         {:name {:before "Changed Scalar Name"
                           :after  "One Scalar to rule them all, one scalar to define them"}
                    :value        {:before 42.2
                                   :after  72.2}}
     :description  "renamed this Scalar from \"Changed Scalar Name\" to \"One Scalar to rule them all, one scalar to define them\"."}
    {:is_reversion false
     :is_creation  false
     :message      "updated"
     :user         (dissoc (user-details (fetch-user :crowberto)) :email :date_joined :last_login :is_superuser :is_qbnewb)
     :diff         {:name {:after  "Changed Scalar Name"
                           :before "One Scalar to rule them all, one scalar to define them"}}
     :description  "renamed this Scalar from \"One Scalar to rule them all, one scalar to define them\" to \"Changed Scalar Name\"."}
    {:is_reversion false
     :is_creation  true
     :message      nil
     :user         (dissoc (user-details (fetch-user :rasta)) :email :date_joined :last_login :is_superuser :is_qbnewb)
     :diff         {:name        {:after "One Scalar to rule them all, one scalar to define them"}
                    :description {:after "One scalar to bring them all, and in the DataModel bind them"}
                    :value       {:after 72.2}
                    :definition  {:after {:database 123
                                          :query    {:filter ["In the Land of Metabase where the Datas lie"]}}}}
     :description  nil}]]
  (tt/with-temp* [Scalar   [{scalar-id :id}
                            {:creator_id              (user->id :crowberto)
                             :name                    "One Scalar to rule them all, one scalar to define them"
                             :value                    42.2
                             :description             "One scalar to bring them all, and in the DataModel bind them"
                             :definition
                               {:creator_id              (user->id :crowberto)
                                :name                    "Reverted Scalar Name"
                                :description             nil
                                :definition {
                                  :database 123
                                  :query    {:filter ["In the Land of Metabase where the Datas lie"]}}}}]
                  Revision [{revision-id :id}
                            {:model       "Scalar"
                             :model_id    scalar-id
                             :object      {
                                :creator_id              (user->id :crowberto)
                                :name                    "One Scalar to rule them all, one scalar to define them"
                                :value                   72.2
                                :description             "One scalar to bring them all, and in the DataModel bind them"

                                :definition              {:database 123
                                                                                       :query    {:filter ["In the Land of Metabase where the Datas lie"]}}}
                                               :is_creation true}]
                  Revision [_                 {:model    "Scalar"
                                               :model_id scalar-id
                                               :user_id  (user->id :crowberto)
                                               :object   {
                                                :creator_id              (user->id :crowberto)
                                                :name                    "Changed Scalar Name"
                                                :value                    72.2
                                                :description             "One scalar to bring them all, and in the DataModel bind them"
                                                          :definition              {:database 123
                                                                                    :query    {:filter ["In the Land of Metabase where the Datas lie"]}}}
                                               :message  "updated"}]]
                 [(dissoc ((user->client :crowberto) :post 200 (format "scalar/%d/revert" scalar-id) {:revision_id revision-id}) :id :timestamp)
                  (doall (for [revision ((user->client :crowberto) :get 200 (format "scalar/%d/revisions" scalar-id))]
                           (dissoc revision :timestamp :id)))]))
