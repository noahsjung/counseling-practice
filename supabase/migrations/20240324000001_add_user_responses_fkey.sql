ALTER TABLE user_responses ADD CONSTRAINT user_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
