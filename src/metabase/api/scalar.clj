(ns metabase.api.scalar
  "/api/scalar endpoints."
  (:require [compojure.core :refer [DELETE GET POST PUT]]
            [metabase.api.common :as api]
            [metabase.models
             [interface :as mi]
             [scalar :as scalar :refer [Scalar]]
             [revision :as revision]]
            [metabase.util.schema :as su]
            [toucan
             [db :as db]
             [hydrate :refer [hydrate]]]))


;; Method == POST /api/scalar/{name, value, description, definition, date}
;; Creates a scalar by it's id,
;; Returns an object representing the new scalarle
(api/defendpoint POST "/"
                 "Create a new `Scalar`."
                 [:as {{:keys [name value description definition date]} :body}]
                 {name su/NonBlankString
    definition su/Map}
                 (api/check-500 (scalar/create! name value description api/*current-user-id* date definition)))

;; Method == GET /api/scalar/:id
;; Fetch a scalar by it's id,
;; Returns a single scalar which matches this id
(api/defendpoint GET "/:id"
  "Fetch a `Scalar` by its ID"
   [id]
   (api/read-check (scalar/fetch-scalar id)))

;; Method == GET /api/scalar/name
;; Fetch a scalar by it's name,
;; Returns a list of scalars which match the name
(api/defendpoint GET "/:name"
   "Fetch a `Scalar` by its Name"
   [name]
   {name su/NonBlankString}
   (api/read-check (scalar/fetch-scalars name)))

;; Method == PUT /api/scalar/:id
;; Update a scalar by it's id
;; Returns the updated scalar
(api/defendpoint PUT "/:id"
   "Update a `Scalar` denoted by it's ID"
   [id :as {{:keys [name value definition revision_msg], :as body} :body}]
   {name          su/NonBlankString
    revision_msg  su/NonBlankString
    definition    su/Map}
   (api/write-check Scalar id)
   (scalar/update!
     (assoc (select-keys body #{:definition :description :name :value :revision_message}) :id id)
     api/*current-user-id*))

;; Method == DELETE /api/scalar/:id
;; Update a scalar by it's id
;; Returns a 204 - 'No Content'
(api/defendpoint DELETE "/:id"
   "Delete a `Scalar` denoted by it's ID"
   [id revision_message]
   {revision_message su/NonBlankString}
   (api/check-superuser)
   (scalar/delete! id api/*current-user-id* revision_message ))

;; Method == GET /api/scalar/:id/revisions
;; Gets the revisions of the `Scalar` denoted by the given ID
;; Returns a list of revision details
(api/defendpoint GET "/:id/revisions"
 "Fetch `Revisions` for the `Scalar` denoted by ID."
 [id]
 (api/write-check Scalar id)
 (revision/revisions+details Scalar id))

;; Method == POST /api/scalar/:id/revert
;; Reverts a `Scalar` to a prior state
;; Returns 200 successful ;TODO - are we supposed to return something here? I see no such thing elsewhere...
(api/defendpoint POST "/:id/revert"
   "Revert a `Scalar` to a prior `Revision`."
   [id :as {{:keys [revision_id]} :body}]
   {revision_id su/IntGreaterThanZero}
   (api/write-check Scalar id)
   (revision/revert!
     :entity        Scalar
     :id            id
     :user-id       api/*current-user-id*
     :revision-id   revision_id))

(api/define-routes)
