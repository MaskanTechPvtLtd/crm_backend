import { PropertiesAssociation } from "./properties.associations.js";
import { LeadsAssociation } from "./leads.associations.js";
import { EmployeeLocationsAssociation } from "./employeeLocations.associations.js";
import { InteractionsAssociation } from "./interactions.associations.js";
import { UserAuthAssociation } from "./userAuth.associations.js";
import { AttendanceAssociation } from "./attendance.associations.js";
import { PropertyMediaAssociation } from "./propertyMedia.associations.js";
import { TasksAssociation } from "./tasks.associations.js";
import { NotificationAssociation } from "./notification.associations.js";
import { CustomerFeedbackAssociations } from "./customerfeedback.associations.js";
import { AmenitiesAssociation } from "./amenities.association.js";

export const applyAllAssociations = () => {
  PropertyMediaAssociation();
  PropertiesAssociation();
  LeadsAssociation();
  EmployeeLocationsAssociation();
  InteractionsAssociation();
  UserAuthAssociation();
  AttendanceAssociation();
  TasksAssociation();
  NotificationAssociation();
  CustomerFeedbackAssociations();
  AmenitiesAssociation()
};