module Config
  module App
    using Pkg
    export db_name

    function env()
      "development"
    end

    function db_config()
      Pkg.TOML.parsefile("app/config/database.toml")
    end

    function db_name()
      db_config()[env()]["name"]
    end
  end
end

export Config
