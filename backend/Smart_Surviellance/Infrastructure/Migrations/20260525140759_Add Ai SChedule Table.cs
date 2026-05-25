using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiSCheduleTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AISchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CameraId = table.Column<int>(type: "int", nullable: false),
                    ModelName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CameraId1 = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AISchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AISchedules_Cameras_CameraId",
                        column: x => x.CameraId,
                        principalTable: "Cameras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AISchedules_Cameras_CameraId1",
                        column: x => x.CameraId1,
                        principalTable: "Cameras",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AIScheduleIntervals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AIScheduleId = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIScheduleIntervals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AIScheduleIntervals_AISchedules_AIScheduleId",
                        column: x => x.AIScheduleId,
                        principalTable: "AISchedules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AIScheduleIntervals_AIScheduleId",
                table: "AIScheduleIntervals",
                column: "AIScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_AISchedules_CameraId",
                table: "AISchedules",
                column: "CameraId");

            migrationBuilder.CreateIndex(
                name: "IX_AISchedules_CameraId1",
                table: "AISchedules",
                column: "CameraId1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIScheduleIntervals");

            migrationBuilder.DropTable(
                name: "AISchedules");
        }
    }
}
