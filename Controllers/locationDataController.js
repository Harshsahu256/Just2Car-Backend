import { Country, State, City } from '../Models/lookupData.model.js';
import { ApiError } from '../Utils/apiError.js';
import { STATUS_CODES, MESSAGES } from '../Utils/status.codes.messages.js';

export const getAllCountries = async (req, res, next) => {
  try {
    const countries = await Country.find({}).sort({ name: 1 });
    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      count: countries.length,
      data: countries,
    });
  } catch (error) {
    next(new ApiError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR_FETCHING_COUNTRIES, [error.message]));
  }
};

export const getStatesByCountry = async (req, res, next) => {
  try {
    const { countryId } = req.params;

    if (!countryId || !countryId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, MESSAGES.BAD_REQUEST + ": Invalid Country ID format.");
    }

    const countryExists = await Country.findById(countryId);
    if (!countryExists) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, MESSAGES.COUNTRY_NOT_FOUND);
    }

    const states = await State.find({ country: countryId }).sort({ name: 1 });
    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      count: states.length,
      data: states,
    });
  } catch (error) {
    next(error);
  }
};

export const getCitiesByState = async (req, res, next) => {
  try {
    const { stateId } = req.params;

    if (!stateId || !stateId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, MESSAGES.BAD_REQUEST + ": Invalid State ID format.");
    }

    const stateExists = await State.findById(stateId);
    if (!stateExists) {
      throw new ApiError(STATUS_CODES.NOT_FOUND, MESSAGES.STATE_NOT_FOUND);
    }

    const cities = await City.find({ state: stateId }).sort({ name: 1 });
    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      count: cities.length,
      data: cities,
    });
  } catch (error) {
    next(error);
  }
};