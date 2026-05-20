from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django.conf import settings
from django.db import connection


class Command(BaseCommand):
    help = (
        "Wipe all tables from the database. "
        "PostgreSQL uses DROP SCHEMA CASCADE (Neon-safe). "
        "Only available when DEBUG=True."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            default=False,
            help="Skip confirmation prompt.",
        )

    # ----------------------------
    # Utilities
    # ----------------------------

    def _get_tables(self):
        return sorted(connection.introspection.table_names())

    def _confirm(self, message):
        confirm = input(f"  {message} [y/N]: ")
        self.stdout.write("")
        return confirm.strip().lower() == "y"

    # ----------------------------
    # Drop Implementations
    # ----------------------------

    def _drop_postgresql(self):
        """
        Neon-safe PostgreSQL wipe.
        Drops and recreates public schema.
        """
        with connection.cursor() as cursor:
            cursor.execute("DROP SCHEMA IF EXISTS public CASCADE;")
            cursor.execute("CREATE SCHEMA public;")
            cursor.execute("GRANT ALL ON SCHEMA public TO CURRENT_USER;")

    def _drop_sqlite(self, tables):
        with connection.cursor() as cursor:
            cursor.execute("PRAGMA foreign_keys = OFF;")
            for table in tables:
                cursor.execute(f'DROP TABLE IF EXISTS "{table}";')
            cursor.execute("PRAGMA foreign_keys = ON;")

    def _drop_mysql(self, tables):
        with connection.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            for table in tables:
                cursor.execute(f"DROP TABLE IF EXISTS `{table}`;")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

    # ----------------------------
    # Main Handler
    # ----------------------------

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "🚫 This command is disabled when DEBUG=False."
            )

        auto_confirm = options["yes"]

        db_name = connection.settings_dict.get("NAME", "unknown")
        vendor = connection.vendor

        tables = self._get_tables()

        if not tables:
            self.stdout.write("")
            self.stdout.write("  No tables found. Nothing to drop.")
            self.stdout.write("")
            return

        # ----------------------------
        # Preview
        # ----------------------------

        self.stdout.write("")
        self.stdout.write(self.style.ERROR(
            "  ╔══════════════════════════════════════════════╗"
        ))
        self.stdout.write(self.style.ERROR(
            "  ║         ⚠️  DESTRUCTIVE OPERATION ⚠️           ║"
        ))
        self.stdout.write(self.style.ERROR(
            "  ╚══════════════════════════════════════════════╝"
        ))
        self.stdout.write("")
        self.stdout.write(f"  Database: {self.style.WARNING(str(db_name))}")
        self.stdout.write(f"  Vendor:   {self.style.WARNING(vendor)}")
        self.stdout.write(f"  Tables:   {self.style.WARNING(str(len(tables)))}")
        self.stdout.write("")

        for table in tables:
            self.stdout.write(self.style.WARNING(f"     ⚠️  {table}"))

        self.stdout.write("")
        self.stdout.write(self.style.ERROR(
            "  ⛔ This will permanently destroy ALL data in the above tables. ⛔"
        ))
        self.stdout.write("")

        if not auto_confirm:
            if not self._confirm("Type 'y' to confirm database wipe"):
                self.stdout.write("  Aborted.")
                self.stdout.write("")
                return

        # ----------------------------
        # Drop Tables
        # ----------------------------

        self.stdout.write(f"  🗑️  Dropping {len(tables)} table(s)...")
        self.stdout.write("")

        try:
            if vendor == "postgresql":
                self._drop_postgresql()
            elif vendor == "sqlite":
                self._drop_sqlite(tables)
            elif vendor == "mysql":
                self._drop_mysql(tables)
            else:
                raise CommandError(f"Unsupported database vendor: {vendor}")
        except Exception as e:
            raise CommandError(f"Failed to wipe database: {e}")

        self.stdout.write(self.style.SUCCESS(
            f"  ✅ Successfully deleted {len(tables)} table(s)."
        ))
        self.stdout.write("")

        # ----------------------------
        # Verify
        # ----------------------------

        remaining = self._get_tables()
        if remaining:
            self.stdout.write(self.style.WARNING(
                f"  ⚠️  {len(remaining)} table(s) still exist (likely system tables):"
            ))
            for table in remaining:
                self.stdout.write(self.style.WARNING(f"     ⚠️  {table}"))
            self.stdout.write("")
        else:
            self.stdout.write(self.style.SUCCESS(
                "  ✅ No remaining user tables detected."
            ))
            self.stdout.write("")

        # ----------------------------
        # Ask for makemigrations
        # ----------------------------

        if self._confirm("Would you like to run makemigrations now?"):
            self.stdout.write("  🔄 Running makemigrations...")
            self.stdout.write("")

            try:
                call_command("makemigrations",
                             stdout=self.stdout,
                             stderr=self.stderr)
            except Exception as e:
                self.stdout.write("")
                self.stdout.write(self.style.ERROR(
                    f"  ❌ makemigrations failed: {e}"
                ))
                self.stdout.write("")
                return

            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS(
                "  ✅ makemigrations completed successfully."
            ))
            self.stdout.write("")

            # ----------------------------
            # Ask for migrate
            # ----------------------------

            if self._confirm("Would you like to run migrate now?"):
                self.stdout.write("  🔄 Running migrate...")
                self.stdout.write("")

                try:
                    call_command("migrate",
                                 stdout=self.stdout,
                                 stderr=self.stderr)
                except Exception as e:
                    self.stdout.write("")
                    self.stdout.write(self.style.ERROR(
                        f"  ❌ migrate failed: {e}"
                    ))
                    self.stdout.write("")
                    return

                self.stdout.write("")
                self.stdout.write(self.style.SUCCESS(
                    "  ✅ migrate completed successfully."
                ))
                self.stdout.write("")

        self.stdout.write(self.style.SUCCESS(
            "  🎉 Database wipe complete."
        ))
        self.stdout.write("")