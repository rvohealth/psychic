module CreateUsersMigration
  include("../../src/migrate/main.jl")
  using Debugger
  using .Migrate

  function up()
    @run Migrate.create_table("users") do
      with_column("zimbazoo")
    end
  end

  function down()
  end
end
