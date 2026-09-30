use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct UserRecord {
    pub id: i64,
    pub username: String,
}

#[get("/api/v1/users/{id}")]
pub async fn get_user(path: web::Path<i64>, pool: web::Data<PgPool>) -> impl Responder {
    let user_id = path.into_inner();
    let res = sqlx::query_as!(UserRecord, "SELECT id, username FROM users WHERE id = $1", user_id)
        .fetch_one(pool.get_ref())
        .await;

    match res {
        Ok(user) => HttpResponse::Ok().json(user),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

#[post("/api/v1/users")]
pub async fn create_user(user: web::Json<UserRecord>) -> impl Responder {
    HttpResponse::Created().json(user.into_inner())
}
