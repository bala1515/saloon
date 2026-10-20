require "minitest/autorun"
require "erb"
require "yaml"
require "json"

class AivenDatabaseTest < Minitest::Test
  KEYS = %w[DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_NAME DB_SSL_CA DB_CACHE_NAME DB_QUEUE_NAME DB_CABLE_NAME].freeze

  def config(overrides = {})
    before = ENV.to_h
    KEYS.each { |key| ENV.delete(key) }
    ENV.update(overrides)
    YAML.safe_load(ERB.new(File.read(File.expand_path("../../config/database.yml", __dir__))).result, aliases: true)
  ensure
    ENV.replace(before)
  end

  def test_remote_connections_are_tls_verified_and_never_inherit_a_local_socket
    production = config("DB_HOST" => "example.aivencloud.com", "DB_PORT" => "12345",
      "DB_USERNAME" => "avnadmin", "DB_PASSWORD" => "quoted:#\"\\value\nnext",
      "DB_SSL_CA" => "/etc/secrets/aiven-ca.pem")["production"]
    assert_equal %w[primary cache queue cable], production.keys
    production.each_value do |connection|
      assert_equal "example.aivencloud.com", connection["host"]
      assert_equal 12345, connection["port"]
      assert_equal "avnadmin", connection["username"]
      assert_equal "quoted:#\"\\value\nnext", connection["password"]
      assert_equal "verify_ca", connection["ssl_mode"]
      assert_equal "/etc/secrets/aiven-ca.pem", connection["sslca"]
      refute connection.key?("socket")
    end
  end

  def test_database_names_can_be_overridden_independently
    names = { "DB_NAME" => "salon", "DB_CACHE_NAME" => "salon_cache", "DB_QUEUE_NAME" => "salon_queue", "DB_CABLE_NAME" => "salon_cable" }
    production = config(names)["production"]
    assert_equal names.values, production.values.map { |connection| connection["database"] }
    assert_equal 4, production.values.map { |connection| connection["database"] }.uniq.length
  end

  def test_defaults_and_local_environments_are_preserved
    settings = config
    assert_equal "defaultdb", settings["production"]["primary"]["database"]
    assert_equal "/etc/secrets/aiven-ca.pem", settings["production"]["primary"]["sslca"]
    assert_equal "saloon_development", settings["development"]["database"]
    assert_equal "saloon_test", settings["test"]["database"]
    assert_equal "/var/run/mysqld/mysqld.sock", settings["development"]["socket"]
  end
end
