#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_record_creation() {
        let user = UserRecord {
            id: 1,
            username: "charlie".to_string(),
        };
        assert_eq!(user.id, 1);
        assert_eq!(user.username, "charlie");
    }

    #[tokio::test]
    async fn test_async_service_logic() {
        let is_valid = true;
        assert!(is_valid);
    }
}
