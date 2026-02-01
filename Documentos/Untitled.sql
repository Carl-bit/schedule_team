CREATE TABLE "empleados" (
  "empleado_id" string PRIMARY KEY,
  "nombre_empleado" varchar,
  "correo_empleado" varchar,
  "password_hash" varchar,
  "puesto_empleado_id" string
);
CREATE TABLE "proyecto" (
  "proyecto_id" varchar PRIMARY KEY,
  "cliente" varchar,
  "fecha_inicio" date,
  "fecha_entrega" date
);
CREATE TABLE "asignaciones" (
  "asignaciones_id" string PRIMARY KEY,
  "empleado_id" string,
  "rol_trabajo_id" string,
  "proyecto_id" varchar
);
CREATE TABLE "catalogo_roles" (
  "rol_trabajo_id" string PRIMARY KEY,
  "rol_trabajo" varchar
);
CREATE TABLE "catologo_empleado" (
  "puesto_empleado_id" string PRIMARY KEY,
  "puesto_empleado" varchar
);
CREATE TABLE "planificacion_horaria" (
  "plan_id" string PRIMARY KEY,
  "empleado_id" string,
  "inicio_turno" timestamp,
  "fin_turno" timestamp
);
CREATE TABLE "registro_horas" (
  "registro_id" string PRIMARY KEY,
  "empleado_id" string,
  "inicio_trabajo" timestamp,
  "fin_trabajo" timestamp,
  "estado_id" integer
);
CREATE TABLE "catalogo_estado" (
  "estado_id" integer PRIMARY KEY,
  "estado" varchar
);
CREATE TABLE "ausencias" (
  "ausencia_id" string PRIMARY KEY,
  "empleado_id" string,
  "tipo_ausencia_id" string,
  "inicio_ausencia" timestamp,
  "fin_ausencia" timestamp
);
CREATE TABLE "catalogo_ausencias" (
  "tipo_id" string PRIMARY KEY,
  "descripcion" varchar
);
ALTER TABLE "empleados"
ADD FOREIGN KEY ("puesto_empleado_id") REFERENCES "catologo_empleado" ("puesto_empleado_id");
ALTER TABLE "asignaciones"
ADD FOREIGN KEY ("empleado_id") REFERENCES "empleados" ("empleado_id");
ALTER TABLE "asignaciones"
ADD FOREIGN KEY ("rol_trabajo_id") REFERENCES "catalogo_roles" ("rol_trabajo_id");
ALTER TABLE "asignaciones"
ADD FOREIGN KEY ("proyecto_id") REFERENCES "proyecto" ("proyecto_id");
ALTER TABLE "planificacion_horaria"
ADD FOREIGN KEY ("empleado_id") REFERENCES "empleados" ("empleado_id");
ALTER TABLE "registro_horas"
ADD FOREIGN KEY ("empleado_id") REFERENCES "empleados" ("empleado_id");
ALTER TABLE "registro_horas"
ADD FOREIGN KEY ("estado_id") REFERENCES "catalogo_estado" ("estado_id");
ALTER TABLE "ausencias"
ADD FOREIGN KEY ("empleado_id") REFERENCES "empleados" ("empleado_id");
ALTER TABLE "ausencias"
ADD FOREIGN KEY ("tipo_ausencia_id") REFERENCES "catalogo_ausencias" ("tipo_id");